import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ApiPaginatedWithPagesResponse } from '../../auth/decorators/paginated.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { PaginatedWithPagesDto } from '../../common/dto/paginated.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateProjetoDocumentDto, CreateProjetoDto, CreateProjetoSeiDto } from './dto/create-projeto.dto';
import { FilterProjetoDto, FilterProjetoMDODto } from './dto/filter-projeto.dto';
import {
    CloneProjetoTarefasDto,
    RevisarObrasDto,
    TransferProjetoPortfolioDto,
    UpdateProjetoDocumentDto,
    UpdateProjetoDto,
    UpdateProjetoRegistroSeiDto,
} from './dto/update-projeto.dto';
import {
    ListProjetoDocumento,
    ListProjetoDto,
    ListProjetoSeiDto,
    ProjetoDetailDto,
    ProjetoDetailMdoDto,
    ProjetoMdoDto,
    ProjetoSeiDto,
    ProjetoV2Dto,
} from './entities/projeto.entity';
import { ProjetoSeiService } from './projeto.sei.service';
import { ProjetoService } from './projeto.service';
import { DetalheOrigensDto, ResumoOrigensMetasItemDto } from '../../common/dto/origem-pdm.dto';
import { TipoProjeto } from '@prisma/client';

export const PROJETO_READONLY_ROLES: ListaDePrivilegios[] = [
    'SMAE.gestor_de_projeto',
    'SMAE.colaborador_de_projeto',
    'SMAE.espectador_de_projeto',
];

const roles: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES,
];

export const PROJETO_READONLY_ROLES_MDO: ListaDePrivilegios[] = [
    'MDO.gestor_de_projeto',
    'MDO.colaborador_de_projeto',
    'MDO.espectador_de_projeto',
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
];

const rolesMDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES_MDO,
];

@ApiTags('Projeto')
@Controller('projeto')
export class ProjetoController {
    private tipo: TipoProjeto = 'PP';
    constructor(
        private readonly projetoService: ProjetoService,
        private readonly projetoSeiService: ProjetoSeiService
    ) {}

    // só o administrador do órgão pode iniciar novos projetos
    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Projeto.administrador', 'Projeto.administrador_no_orgao'])
    async create(
        @Body() createProjetoDto: CreateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoService.create(this.tipo, createProjetoDto, user);
    }

    @Get('v2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiExtraModels(ResumoOrigensMetasItemDto, DetalheOrigensDto)
    @ApiPaginatedWithPagesResponse(ProjetoMdoDto)
    async findAllV2(
        @Query() filters: FilterProjetoMDODto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<ProjetoV2Dto>> {
        return this.projetoService.findAllV2(this.tipo, filters, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findAll(@Query() filters: FilterProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDto> {
        return { linhas: await this.projetoService.findAll(this.tipo, filters, user) };
    }

    @Post('revisar')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.administrador', 'Projeto.revisar_projeto'])
    async updateProjetoRevisao(
        @Body() revisarObrasDto: RevisarObrasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId[]> {
        return await this.projetoService.updateProjetoRevisao(this.tipo, revisarObrasDto, user);
    }

    @Post('revisar-todas')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.administrador', 'Projeto.revisar_projeto'])
    async deleteProjetoRevisao(@CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.deleteProjetoRevisao(this.tipo, user);
        return;
    }

    //@IsPublic()
    @ApiBearerAuth('access-token')
    @Get(':id/html-unidade-entrega')
    async getHtmlUnidadeEntrega(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @Res() res: Response
    ): Promise<void> {
        const dados = await this.projetoService.getDadosProjetoUe(this.tipo, params.id, user);

        //const templatesDir = join(__dirname, '..', 'templates');
        //ejs.renderFile(join(templatesDir, 'users.ejs'), { users })
        //    .then(renderedHtml => {
        //        res.json({ html: renderedHtml });
        //    })
        //    .catch(error => {
        //        res.status(500).json({ error: 'An error occurred while rendering the template.' });
        //    });

        return res.render('projeto-ue', { ...dados });
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoDetailDto> {
        return await this.projetoService.findOne(this.tipo, params.id, user, 'ReadOnly');
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: UpdateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWrite');

        return await this.projetoService.update(this.tipo, projeto.id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWrite');

        await this.projetoService.remove(this.tipo, projeto.id, user);
        return '';
    }

    @Post(':id/documento')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async upload(
        @Param() params: FindOneParams,
        @Body() createPdmDocDto: CreateProjetoDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');

        return await this.projetoService.append_document(this.tipo, params.id, createPdmDocDto, user);
    }

    @Get(':id/documento')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async download(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDocumento> {
        return { linhas: await this.projetoService.list_document(this.tipo, params.id, user) };
    }

    @Patch(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async updateDocumento(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateProjetoDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        return await this.projetoService.updateDocumento(this.tipo, params.id, params.id2, dto, user);
    }

    @Delete(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        await this.projetoService.remove_document(this.tipo, params.id, params.id2, user);
        return null;
    }

    @Post(':id/sei')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async createSEI(
        @Param() params: FindOneParams,
        @Body() createProjetoRegistroSei: CreateProjetoSeiDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        return await this.projetoSeiService.append_sei(this.tipo, projeto, createProjetoRegistroSei, user);
    }

    @Get(':id/sei')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async listSEI(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoSeiDto> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadOnly');
        return { linhas: await this.projetoSeiService.list_sei(this.tipo, projeto, user) };
    }

    @Get(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findOneSEI(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoSeiDto> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadOnly');
        const rows = await this.projetoSeiService.list_sei(this.tipo, projeto, user, params.id2);
        if (!rows[0]) throw new HttpException('SEI não encontrado', 404);
        return rows[0];
    }

    @Patch(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async updateSEI(
        @Param() params: FindTwoParams,
        @Body() updateProjetoRegistroSeiDto: UpdateProjetoRegistroSeiDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        return await this.projetoSeiService.update_sei(
            this.tipo,
            projeto,
            params.id2,
            updateProjetoRegistroSeiDto,
            user
        );
    }

    @Delete(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeSEI(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        await this.projetoSeiService.remove_sei(this.tipo, projeto, params.id2, user);
        return null;
    }

    @Post(':id/clone-tarefas')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async cloneTarefas(
        @Param() params: FindOneParams,
        @Body() cloneProjetoTarefasdto: CloneProjetoTarefasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        await this.projetoService.cloneTarefas(this.tipo, params.id, cloneProjetoTarefasdto, user);
        return;
    }

    @Post(':id/transferir-portfolio')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async transferPortfolio(
        @Param() params: FindOneParams,
        @Body() transferProjetoPortfolio: TransferProjetoPortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoService.transferPortfolio(this.tipo, params.id, transferProjetoPortfolio, user);
    }
}

@ApiTags('Cadastro de Obras (Projetos)')
@Controller('projeto-mdo')
export class ProjetoMDOController {
    private tipo: TipoProjeto = 'MDO';
    constructor(
        private readonly projetoService: ProjetoService,
        private readonly projetoSeiService: ProjetoSeiService
    ) {}

    // só o administrador do órgão pode iniciar novos projetos
    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.administrador_no_orgao'])
    async create(
        @Body() createProjetoDto: CreateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoService.create(this.tipo, createProjetoDto, user);
    }

    @Get('v2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiExtraModels(ResumoOrigensMetasItemDto, DetalheOrigensDto)
    @ApiPaginatedWithPagesResponse(ProjetoMdoDto)
    async findAllV2(
        @Query() filters: FilterProjetoMDODto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<ProjetoMdoDto>> {
        return this.projetoService.findAllV2(this.tipo, filters, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiExtraModels(ResumoOrigensMetasItemDto, DetalheOrigensDto)
    @ApiPaginatedWithPagesResponse(ProjetoMdoDto)
    async findAll(
        @Query() filters: FilterProjetoMDODto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<ProjetoMdoDto>> {
        return this.projetoService.findAllMDO(filters, user);
    }

    @Post(['revisar-obras', 'revisar'])
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.administrador', 'MDO.revisar_obra'])
    async updateProjetoRevisao(
        @Body() revisarObrasDto: RevisarObrasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId[]> {
        return await this.projetoService.updateProjetoRevisao(this.tipo, revisarObrasDto, user);
    }

    @Post(['revisar-obras-todas', 'revisar-todas'])
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.administrador', 'MDO.revisar_obra'])
    async deleteProjetoRevisao(@CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.deleteProjetoRevisao(this.tipo, user);
        return;
    }

    //@IsPublic()
    @ApiBearerAuth('access-token')
    @Get(':id/html-unidade-entrega')
    async getHtmlUnidadeEntrega(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @Res() res: Response
    ): Promise<void> {
        const dados = await this.projetoService.getDadosProjetoUe(this.tipo, params.id, user);

        //const templatesDir = join(__dirname, '..', 'templates');
        //ejs.renderFile(join(templatesDir, 'users.ejs'), { users })
        //    .then(renderedHtml => {
        //        res.json({ html: renderedHtml });
        //    })
        //    .catch(error => {
        //        res.status(500).json({ error: 'An error occurred while rendering the template.' });
        //    });

        return res.render('projeto-ue', { ...dados });
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoDetailMdoDto> {
        return (await this.projetoService.findOne(this.tipo, params.id, user, 'ReadOnly')) as ProjetoDetailMdoDto;
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: UpdateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWrite');

        return await this.projetoService.update(this.tipo, projeto.id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWrite');

        await this.projetoService.remove(this.tipo, projeto.id, user);
        return '';
    }

    @Post(':id/documento')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async upload(
        @Param() params: FindOneParams,
        @Body() createPdmDocDto: CreateProjetoDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');

        return await this.projetoService.append_document(this.tipo, params.id, createPdmDocDto, user);
    }

    @Get(':id/documento')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async download(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDocumento> {
        return { linhas: await this.projetoService.list_document(this.tipo, params.id, user) };
    }

    @Patch(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async updateDocumento(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateProjetoDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        return await this.projetoService.updateDocumento(this.tipo, params.id, params.id2, dto, user);
    }

    @Delete(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        await this.projetoService.remove_document(this.tipo, params.id, params.id2, user);
        return null;
    }

    @Post(':id/sei')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async createSEI(
        @Param() params: FindOneParams,
        @Body() createProjetoRegistroSei: CreateProjetoSeiDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        return await this.projetoSeiService.append_sei(this.tipo, projeto, createProjetoRegistroSei, user);
    }

    @Get(':id/sei')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async listSEI(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoSeiDto> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadOnly');
        return { linhas: await this.projetoSeiService.list_sei(this.tipo, projeto, user) };
    }

    @Get(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findOneSEI(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoSeiDto> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadOnly');
        const rows = await this.projetoSeiService.list_sei(this.tipo, projeto, user, params.id2);
        if (!rows[0]) throw new HttpException('SEI não encontrado', 404);
        return rows[0];
    }

    @Patch(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async updateSEI(
        @Param() params: FindTwoParams,
        @Body() updateProjetoRegistroSeiDto: UpdateProjetoRegistroSeiDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        return await this.projetoSeiService.update_sei(
            this.tipo,
            projeto,
            params.id2,
            updateProjetoRegistroSeiDto,
            user
        );
    }

    @Delete(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeSEI(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(this.tipo, params.id, user, 'ReadWriteTeam');
        await this.projetoSeiService.remove_sei(this.tipo, projeto, params.id2, user);
        return null;
    }

    @Post(':id/clone-tarefas')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async cloneTarefas(
        @Param() params: FindOneParams,
        @Body() cloneProjetoTarefasdto: CloneProjetoTarefasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        await this.projetoService.cloneTarefas(this.tipo, params.id, cloneProjetoTarefasdto, user);
        return;
    }

    @Post(':id/transferir-portfolio')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async transferPortfolio(
        @Param() params: FindOneParams,
        @Body() transferProjetoPortfolio: TransferProjetoPortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoService.transferPortfolio(this.tipo, params.id, transferProjetoPortfolio, user);
    }
}
