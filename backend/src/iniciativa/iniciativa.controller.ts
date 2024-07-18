import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateIniciativaDto } from './dto/create-iniciativa.dto';
import { FilterIniciativaDto } from './dto/filter-iniciativa.dto';
import { ListIniciativaDto } from './dto/list-iniciativa.dto';
import { UpdateIniciativaDto } from './dto/update-iniciativa.dto';
import { IniciativaService } from './iniciativa.service';
import { TipoPdm } from '@prisma/client';

@ApiTags('Iniciativa')
@Controller('iniciativa')
export class IniciativaController {
    private tipoPdm: TipoPdm = 'PDM';
    constructor(private readonly iniciativaService: IniciativaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIniciativa.inserir', 'CadastroMeta.inserir'])
    async create(
        @Body() createIniciativaDto: CreateIniciativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.iniciativaService.create(this.tipoPdm, createIniciativaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMeta.listar'])
    async findAll(
        @Query() filters: FilterIniciativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListIniciativaDto> {
        return { linhas: await this.iniciativaService.findAll(this.tipoPdm, filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIniciativa.editar', 'CadastroMeta.inserir'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateIniciativaDto: UpdateIniciativaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.iniciativaService.update(this.tipoPdm, +params.id, updateIniciativaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIniciativa.remover', 'CadastroMeta.inserir'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.iniciativaService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Iniciativa')
@Controller('iniciativa-setorial')
export class IniciativaSetorialController {
    private tipoPdm: TipoPdm = 'PS';
    constructor(private readonly iniciativaService: IniciativaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIniciativaPS.inserir', 'CadastroMetaPS.inserir'])
    async create(
        @Body() createIniciativaDto: CreateIniciativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.iniciativaService.create(this.tipoPdm, createIniciativaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMetaPS.listar'])
    async findAll(
        @Query() filters: FilterIniciativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListIniciativaDto> {
        return { linhas: await this.iniciativaService.findAll(this.tipoPdm, filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIniciativaPS.editar', 'CadastroMetaPS.inserir'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateIniciativaDto: UpdateIniciativaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.iniciativaService.update(this.tipoPdm, +params.id, updateIniciativaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIniciativaPS.remover', 'CadastroMetaPS.inserir'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.iniciativaService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}
