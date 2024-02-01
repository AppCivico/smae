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
import { ApiBearerAuth, ApiNoContentResponse, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateProjetoDocumentDto, CreateProjetoDto, CreateProjetoSeiDto } from './dto/create-projeto.dto';
import { FilterProjetoDto } from './dto/filter-projeto.dto';
import { CloneProjetoTarefasDto, TransferProjetoPortfolioDto, UpdateProjetoDocumentDto, UpdateProjetoDto, UpdateProjetoRegistroSeiDto } from './dto/update-projeto.dto';
import {
    ListProjetoDocumento,
    ListProjetoDto,
    ListProjetoSeiDto,
    ProjetoDetailDto,
    ProjetoSeiDto,
} from './entities/projeto.entity';
import { ProjetoSeiService } from './projeto.sei.service';
import { ProjetoService } from './projeto.service';

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

@ApiTags('Projeto')
@Controller('projeto')
export class ProjetoController {
    constructor(
        private readonly projetoService: ProjetoService,
        private readonly projetoSeiService: ProjetoSeiService
    ) {}

    // só o administrador do órgão pode iniciar novos projetos
    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador_no_orgao')
    async create(
        @Body() createProjetoDto: CreateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoService.create(createProjetoDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(@Query() filters: FilterProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDto> {
        return { linhas: await this.projetoService.findAll(filters, user) };
    }

    //@IsPublic()
    @ApiBearerAuth('access-token')
    @Get(':id/html-unidade-entrega')
    async getHtmlUnidadeEntrega(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @Res() res: Response
    ): Promise<void> {
        const dados = await this.projetoService.getDadosProjetoUe(params.id, user);

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
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoDetailDto> {
        return await this.projetoService.findOne(params.id, user, 'ReadOnly');
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: UpdateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');

        return await this.projetoService.update(projeto.id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');

        await this.projetoService.remove(projeto.id, user);
        return '';
    }

    @Post(':id/documento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async upload(
        @Param() params: FindOneParams,
        @Body() createPdmDocDto: CreateProjetoDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');

        return await this.projetoService.append_document(params.id, createPdmDocDto, user);
    }

    @Get(':id/documento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async download(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDocumento> {
        return { linhas: await this.projetoService.list_document(params.id, user) };
    }

    @Patch(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async updateDocumento(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateProjetoDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');
        return await this.projetoService.updateDocumento(params.id, params.id2, dto, user);
    }

    @Delete(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles(...roles)
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');
        await this.projetoService.remove_document(params.id, params.id2, user);
        return null;
    }

    @Post(':id/sei')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async createSEI(
        @Param() params: FindOneParams,
        @Body() createProjetoRegistroSei: CreateProjetoSeiDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');
        return await this.projetoSeiService.append_sei(projeto, createProjetoRegistroSei, user);
    }

    @Get(':id/sei')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async listSEI(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoSeiDto> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadOnly');
        return { linhas: await this.projetoSeiService.list_sei(projeto, user) };
    }

    @Get(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOneSEI(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoSeiDto> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadOnly');
        const rows = await this.projetoSeiService.list_sei(projeto, user, params.id2);
        if (!rows[0]) throw new HttpException('SEI não encontrado', 404);
        return rows[0];
    }

    @Patch(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async updateSEI(
        @Param() params: FindTwoParams,
        @Body() updateProjetoRegistroSeiDto: UpdateProjetoRegistroSeiDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');
        return await this.projetoSeiService.update_sei(projeto, params.id2, updateProjetoRegistroSeiDto, user);
    }

    @Delete(':id/sei/:id2')
    @ApiBearerAuth('access-token')
    @Roles(...roles)
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeSEI(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');
        await this.projetoSeiService.remove_sei(projeto, params.id2, user);
        return null;
    }

    @Post(':id/clone-tarefas')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async cloneTarefas(
        @Param() params: FindOneParams,
        @Body() cloneProjetoTarefasdto: CloneProjetoTarefasDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        await this.projetoService.cloneTarefas(params.id, cloneProjetoTarefasdto, user);
    }

    @Post(':id/transferir-portfolio')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async transferPortfolio(
        @Param() params: FindOneParams,
        @Body() transferProjetoPortfolio: TransferProjetoPortfolioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.projetoService.transferPortfolio(params.id, transferProjetoPortfolio, user);
    }
    
}
