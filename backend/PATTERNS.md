# SMAE Backend - Development Patterns & Conventions

This document contains patterns and conventions learned from implementing features in the SMAE backend. Use this as a reference to reduce iteration and token usage in future implementations.

## Table of Contents
- [Prisma Schema Patterns](#prisma-schema-patterns)
- [NestJS Module Structure](#nestjs-module-structure)
- [Service Layer Patterns](#service-layer-patterns)
- [Controller Patterns](#controller-patterns)
- [Privilege System](#privilege-system)
- [Migration Workflow](#migration-workflow)
- [Seed File Structure](#seed-file-structure)

---

## Prisma Schema Patterns

### Audit Fields (Standard for all models)
```prisma
model ExampleModel {
    id Int @id @default(autoincrement())

    // Your fields here
    nome  String  @db.VarChar(255)
    ativo Boolean @default(true)

    // Audit fields (ALWAYS include these)
    criado_por     Int
    criado_em      DateTime  @default(now()) @db.Timestamptz(6)
    atualizado_por Int?
    atualizado_em  DateTime  @default(now()) @db.Timestamptz(6)
    removido_por   Int?
    removido_em    DateTime? @db.Timestamptz(6)

    // Relations use SHARED names across models
    criador     Pessoa  @relation("Criador", fields: [criado_por], references: [id])
    atualizador Pessoa? @relation("Atualizador", fields: [atualizado_por], references: [id])
    removedor   Pessoa? @relation("Removedor", fields: [removido_por], references: [id])

    @@map("example_model")
}
```

### Shared Relation Names
**CRITICAL**: Use these exact relation names, shared across ALL models:
- `"Criador"` - for created_by relations
- `"Atualizador"` - for updated_by relations
- `"Removedor"` - for removed_by relations

**DO NOT** create unique relation names like `"AreaTematicaCriador"` - this causes Prisma to generate duplicate types.

### Pessoa Model Relations
When adding a new model with audit fields, add 6 relation arrays to `Pessoa`:
```prisma
model Pessoa {
    // ... existing fields ...

    ExampleModelQueCriei     ExampleModel[] @relation("Criador")
    ExampleModelQueAtualizei ExampleModel[] @relation("Atualizador")
    ExampleModelQueRemovi    ExampleModel[] @relation("Removedor")
}
```

### Partial Unique Indexes
For soft-delete models, add partial unique indexes in migration SQL:
```sql
-- Add AFTER Prisma generates the migration
CREATE UNIQUE INDEX "example_model_nome_unico"
    ON "example_model"("nome")
    WHERE "removido_em" IS NULL;
```

### Migration Workflow
1. Edit `prisma/schema.prisma`
2. Generate migration: `npm run db:migrate:gen 'migration-name'`
3. **Edit generated SQL** to add partial unique indexes
4. Apply migration: `npm run db:migrate:up`

---

## NestJS Module Structure

### Standard Module Layout
```
src/casa-civil/example-module/
├── dto/
│   ├── create-example.dto.ts
│   └── update-example.dto.ts
├── entities/
│   └── example.entity.ts
├── example.controller.ts
├── example.service.ts
└── example.module.ts
```

### DTO Patterns

#### Create DTO
```typescript
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateExampleDto {
    @IsString({ message: 'nome precisa ser uma string' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `nome deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsOptional()
    @IsBoolean({ message: 'ativo precisa ser um booleano' })
    ativo?: boolean;
}
```

**Use constants**: `MAX_LENGTH_DEFAULT` instead of hardcoded `255`

#### Update DTO
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateExampleDto } from './create-example.dto';

export class UpdateExampleDto extends PartialType(CreateExampleDto) {}
```

#### Entity DTO
```typescript
export class ExampleDto {
    id: number;
    nome: string;
    ativo: boolean;
}

export class ListExampleDto {
    linhas: ExampleDto[];
}
```

---

## Service Layer Patterns

### Transaction Pattern
**ALWAYS** use `UncheckedUpdateInput` for updates with foreign keys:
```typescript
import { Prisma } from '@prisma/client';

async update(id: number, dto: UpdateDto, user: PessoaFromJwt) {
    return await this.prisma.$transaction(
        async (prismaTxn: Prisma.TransactionClient) => {
            const now = new Date(Date.now());

            // Use UncheckedUpdateInput to allow foreign key fields
            const updateData: Prisma.ExampleModelUncheckedUpdateInput = {
                atualizado_por: user.id,
                atualizado_em: now,
            };

            if (dto.nome !== undefined) updateData.nome = dto.nome;

            return await prismaTxn.exampleModel.update({
                where: { id },
                data: updateData,
            });
        },
        {
            isolationLevel: 'ReadCommitted',
        }
    );
}
```

### Error Handling
Use `HttpException` (not `BadRequestException`):
```typescript
import { HttpException } from '@nestjs/common';

if (!found) {
    throw new HttpException('Registro não encontrado', 404);
}

if (invalid) {
    throw new HttpException('Mensagem de erro', 400);
}
```

### Soft Delete Pattern
```typescript
async remove(id: number, user: PessoaFromJwt): Promise<void> {
    await this.prisma.$transaction(
        async (prismaTxn: Prisma.TransactionClient) => {
            const now = new Date(Date.now());

            const existing = await prismaTxn.exampleModel.findFirst({
                where: { id, removido_em: null },
                select: { id: true },
            });

            if (!existing) {
                throw new HttpException('Registro não encontrado', 404);
            }

            await prismaTxn.exampleModel.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: now,
                },
            });
        },
        {
            isolationLevel: 'ReadCommitted',
        }
    );
}
```

### Query Filters
**ALWAYS** filter by `removido_em: null` when querying:
```typescript
await this.prisma.exampleModel.findMany({
    where: { removido_em: null },
    select: {
        id: true,
        nome: true,
        ativo: true,
    },
    orderBy: { nome: 'asc' },
});
```

---

## Controller Patterns

### Standard CRUD Controller
```typescript
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@ApiTags('Configurações - Demandas - Example')
@Controller('example')
export class ExampleController {
    constructor(private readonly exampleService: ExampleService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroExample.inserir'])
    async create(@Body() dto: CreateDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.exampleService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroExample.listar'])
    async findAll(): Promise<ListDto> {
        return { linhas: await this.exampleService.findAll() };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroExample.listar'])
    async findOne(@Param() params: FindOneParams): Promise<Dto> {
        return await this.exampleService.findOne(+params.id);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroExample.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.exampleService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroExample.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.exampleService.remove(+params.id, user);
        return '';
    }
}
```

### ApiTags Convention
For Casa Civil modules: `'Configurações - Demandas - [Module Name]'`

---

## Privilege System

### Naming Convention
Format: `Cadastro[ModuleName].[action]`

Actions:
- `.inserir` - Create
- `.editar` - Update
- `.listar` - Read/List
- `.remover` - Delete

### Adding Privileges

#### 1. ListaDePrivilegios.ts
```typescript
// src/common/ListaDePrivilegios.ts
export type ListaDePrivilegios =
    // ... existing privileges ...
    | 'CadastroExample.inserir'
    | 'CadastroExample.editar'
    | 'CadastroExample.listar'
    | 'CadastroExample.remover'
```

#### 2. Seed File
Add module definition:
```typescript
// prisma/seed.ts
const modulos: Record<string, [string, string | null | string[]]> = {
    // ... existing modules ...
    CadastroExample: ['Example Description', 'CasaCivil'],
};
```

Add privilege descriptions:
```typescript
// prisma/seed.ts
const privilegios: Record<string, [string, string][]> = {
    // ... existing privileges ...
    CadastroExample: [
        ['CadastroExample.inserir', 'Inserir Example'],
        ['CadastroExample.editar', 'Editar Example'],
        ['CadastroExample.listar', 'Listar Examples'],
        ['CadastroExample.remover', 'Remover Example'],
    ],
};
```

---

## Migration Workflow

### Step-by-step Process
1. **Edit schema**: Modify `prisma/schema.prisma`
2. **Generate migration**: `npm run db:migrate:gen 'migration-name'`
3. **Edit migration SQL**: Add partial unique indexes manually
4. **Apply migration**: `npm run db:migrate:up`
5. **Verify build**: `npm run build`

### Example Migration Edit
After generating migration, append to SQL file:
```sql
-- CreateTable (Prisma generated this)
CREATE TABLE "example_model" (
    -- ... columns ...
);

-- AddForeignKey (Prisma generated this)
ALTER TABLE "example_model" ADD CONSTRAINT ...;

-- CreateIndex (YOU ADD THIS MANUALLY)
CREATE UNIQUE INDEX "example_model_nome_unico"
    ON "example_model"("nome")
    WHERE "removido_em" IS NULL;
```

---

## Seed File Structure

### Location
`prisma/seed.ts`

### Module Registration
Add to `modulos` object:
```typescript
const modulos: Record<string, [string, string | null | string[]]> = {
    CadastroExample: ['Module Display Name', 'CasaCivil'],
    //                 ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^
    //                 Display name          Menu category
};
```

### Privilege Descriptions
Add to `privilegios` object:
```typescript
const privilegios: Record<string, [string, string][]> = {
    CadastroExample: [
        ['CadastroExample.inserir', 'Inserir Example'],
        ['CadastroExample.editar', 'Editar Example'],
        ['CadastroExample.listar', 'Listar Examples'],
        ['CadastroExample.remover', 'Remover Example'],
    ],
};
```

---

## Module Registration

### app.module.ts
```typescript
// 1. Import at top
import { ExampleModule } from './casa-civil/example/example.module';

// 2. Add to imports array
@Module({
    imports: [
        // ... existing imports ...
        DemandaConfigModule,
        ExampleModule,  // Add after related modules
        // ... rest of imports ...
    ],
})
```

### Module File
```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';

@Module({
    imports: [PrismaModule],
    controllers: [ExampleController],
    providers: [ExampleService],
    exports: [ExampleService], // Export if other modules need it
})
export class ExampleModule {}
```

---

## Common Pitfalls

### ❌ DON'T
```typescript
// Don't use unique relation names
criador Pessoa @relation("AreaTematicaCriador", ...)

// Don't use UpdateInput with foreign keys
const data: Prisma.ModelUpdateInput = {
    atualizado_por: user.id, // ERROR!
};

// Don't forget removido_em filter
await prisma.model.findMany({
    where: { ativo: true }, // Missing removido_em: null
});

// Don't hardcode lengths
@MaxLength(255, { message: 'too long' })

// Don't use BadRequestException
throw new BadRequestException('Error');
```

### ✅ DO
```typescript
// Use shared relation names
criador Pessoa @relation("Criador", ...)

// Use UncheckedUpdateInput with foreign keys
const data: Prisma.ModelUncheckedUpdateInput = {
    atualizado_por: user.id, // OK!
};

// Always filter soft-deleted records
await prisma.model.findMany({
    where: { removido_em: null },
});

// Use constants
@MaxLength(MAX_LENGTH_DEFAULT, { message: `max ${MAX_LENGTH_DEFAULT}` })

// Use HttpException
throw new HttpException('Error message', 400);
```

---

## Quick Reference Checklist

When implementing a new CRUD module:

- [ ] Prisma schema with audit fields
- [ ] Shared relation names ("Criador", "Atualizador", "Removedor")
- [ ] Add 3 relations to Pessoa model
- [ ] Generate migration
- [ ] Add partial unique indexes to migration SQL
- [ ] Apply migration
- [ ] Create DTOs (create, update, entity)
- [ ] Create service with transaction pattern
- [ ] Use UncheckedUpdateInput for updates
- [ ] Always filter by `removido_em: null`
- [ ] Create controller with standard CRUD endpoints
- [ ] Add privileges to ListaDePrivilegios.ts
- [ ] Add module/privileges to seed.ts
- [ ] Register module in app.module.ts
- [ ] Run `npm run build` to verify

---

## Examples

See these modules for reference implementations:
- `src/casa-civil/demanda-config/` - Simple CRUD with file uploads
- `src/casa-civil/area-tematica/` - CRUD with nested child entities
- `src/casa-civil/tipo-vinculo/` - Basic CRUD pattern
