import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateFonteRecursoDto } from './dto/create-fonte-recurso.dto';
import { ListFonteRecursoDto } from './dto/list-fonte-recurso.dto';
import { UpdateFonteRecursoDto } from './dto/update-fonte-recurso.dto';
import { FonteRecursoService } from './fonte-recurso.service';

@ApiTags('Fonte de Recurso')
@Controller('fonte-recurso')
export class FonteRecursoController {
    constructor(private readonly fonteRecursoService: FonteRecursoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroFonteRecurso.inserir'])
    async create(
        @Body() createFonteRecursoDto: CreateFonteRecursoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.fonteRecursoService.create(createFonteRecursoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListFonteRecursoDto> {
        return { linhas: await this.fonteRecursoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroFonteRecurso.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateFonteRecursoDto: UpdateFonteRecursoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.fonteRecursoService.update(+params.id, updateFonteRecursoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroFonteRecurso.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.fonteRecursoService.remove(+params.id, user);
        return '';
    }
}
