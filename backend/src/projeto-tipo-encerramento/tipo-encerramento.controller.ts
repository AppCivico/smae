import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import {
    ListTipoEncerramentoDto,
    CreateTipoEncerramentoDto,
    UpdateTipoEncerramentoDto,
} from './dto/tipo-encerramento.dto';
import { TipoEncerramentoService } from './tipo-encerramento.service';
import { TipoProjeto } from '@prisma/client';

@ApiTags('Tipo Encerramento')
@Controller('projeto-tipo-encerramento')
export class ProjetoTipoEncerramentoController {
    private readonly tipo: TipoProjeto = 'PP';
    constructor(private readonly tipoOrgaoService: TipoEncerramentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoTipoEncerramento.inserir'])
    async create(
        @Body() createTipoOrgaoDto: CreateTipoEncerramentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoOrgaoService.create(this.tipo, createTipoOrgaoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListTipoEncerramentoDto> {
        return { linhas: await this.tipoOrgaoService.findAll(this.tipo) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoTipoEncerramento.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTipoEncerramentoDto: UpdateTipoEncerramentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoOrgaoService.update(this.tipo, +params.id, updateTipoEncerramentoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoTipoEncerramento.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoOrgaoService.remove(this.tipo, +params.id, user);
        return '';
    }
}

@ApiTags('Tipo Encerramento')
@Controller('obra-tipo-encerramento')
export class ObraTipoEncerramentoController {
    private readonly tipo: TipoProjeto = 'MDO';
    constructor(private readonly tipoOrgaoService: TipoEncerramentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoTipoEncerramento.inserir'])
    async create(
        @Body() createTipoOrgaoDto: CreateTipoEncerramentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoOrgaoService.create(this.tipo, createTipoOrgaoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListTipoEncerramentoDto> {
        return { linhas: await this.tipoOrgaoService.findAll(this.tipo) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoTipoEncerramento.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTipoEncerramentoDto: UpdateTipoEncerramentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoOrgaoService.update(this.tipo, +params.id, updateTipoEncerramentoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroProjetoTipoEncerramento.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoOrgaoService.remove(this.tipo, +params.id, user);
        return '';
    }
}
