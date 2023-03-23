import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateProjetoDocumentDto, CreateProjetoDto, CreateProjetoSeiDto } from './dto/create-projeto.dto';
import { FilterProjetoDto } from './dto/filter-projeto.dto';
import { UpdateProjetoDto, UpdateProjetoRegistroSeiDto } from './dto/update-projeto.dto';
import { ListProjetoDocumento, ListProjetoDto, ListProjetoSeiDto, ProjetoDetailDto, ProjetoSeiDto } from './entities/projeto.entity';
import { ProjetoSeiService } from './projeto.sei.service';
import { ProjetoService } from './projeto.service';

@ApiTags('Projeto')
@Controller('projeto')
export class ProjetoController {
    constructor(
        private readonly projetoService: ProjetoService,
        private readonly projetoSeiService: ProjetoSeiService
    ) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    async create(@Body() createProjetoDto: CreateProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.projetoService.create(createProjetoDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async findAll(@Query() filters: FilterProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDto> {
        return { linhas: await this.projetoService.findAll(filters, user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoDetailDto> {
        return await this.projetoService.findOne(params.id, user, true);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async update(@Param() params: FindOneParams, @Body() updateProjetoDto: UpdateProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.projetoService.update(params.id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.remove(params.id, user);
        return '';
    }

    @Post(':id/documento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async upload(@Param() params: FindOneParams, @Body() createPdmDocDto: CreateProjetoDocumentDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.projetoService.append_document(params.id, createPdmDocDto, user);
    }

    @Get(':id/documento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async download(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDocumento> {
        return { linhas: await this.projetoService.list_document(params.id, user) };
    }

    @Delete(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.remove_document(params.id, params.id2, user);
        return null;
    }

    @Post(':id/sei')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async createSEI(@Param() params: FindOneParams, @Body() createProjetoRegistroSei: CreateProjetoSeiDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, false);
        return await this.projetoSeiService.append_sei(projeto, createProjetoRegistroSei, user);
    }

    @Get(':id/sei')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async listSEI(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoSeiDto> {
        const projeto = await this.projetoService.findOne(params.id, user, true);
        return { linhas: await this.projetoSeiService.list_sei(projeto, user) };
    }

    @Get(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async findOneSEI(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoSeiDto> {
        const projeto = await this.projetoService.findOne(params.id, user, true);
        const rows = await this.projetoSeiService.list_sei(projeto, user, params.id2);
        if (!rows[0]) throw new HttpException("SEI não encontrado", 404);
        return rows[0];
    }

    @Patch(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async updateSEI(@Param() params: FindTwoParams, @Body() updateProjetoRegistroSeiDto: UpdateProjetoRegistroSeiDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, false);
        return await this.projetoSeiService.update_sei(projeto, params.id2, updateProjetoRegistroSeiDto, user);
    }

    @Delete(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeSEI(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, false);
        await this.projetoSeiService.remove_sei(projeto, params.id2, user);
        return null;
    }
}
