import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Post,
    Query,
    forwardRef,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, refs } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { TipoPDM } from '../common/decorators/current-tipo-pdm';
import { FindOneParams, FindTwoParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MacroTemaService } from '../macro-tema/macro-tema.service';
import { SubTemaService } from '../subtema/subtema.service';
import { TagService } from '../tag/tag.service';
import { TemaService } from '../tema/tema.service';
import { CreatePdmDocumentDto, UpdatePdmDocumentDto } from './dto/create-pdm-document.dto';
import { CreatePdmDto } from './dto/create-pdm.dto';
import { DetalhePSDto, DetalhePdmDto } from './dto/detalhe-pdm.dto';
import { FilterPdmDetailDto, FilterPdmDto } from './dto/filter-pdm.dto';
import { CicloFisicoDto, ListPdmDto, OrcamentoConfig } from './dto/list-pdm.dto';
import { PdmDto, PlanoSetorialDto } from './dto/pdm.dto';
import { UpdatePdmOrcamentoConfigDto } from './dto/update-pdm-orcamento-config.dto';
import { UpdatePdmDto } from './dto/update-pdm.dto';
import { ListPdmDocument } from './entities/list-pdm-document.entity';
import { PdmService, TipoPdmType } from './pdm.service';

@ApiTags('PDM')
@Controller('pdm')
export class PdmController {
    private tipoPdm: TipoPdm = 'PDM';
    constructor(
        private readonly pdmService: PdmService,
        @Inject(forwardRef(() => TemaService))
        private readonly objetivoEstrategicoService: TemaService,
        @Inject(forwardRef(() => SubTemaService))
        private readonly subTemaService: SubTemaService,
        @Inject(forwardRef(() => MacroTemaService))
        private readonly eixoService: MacroTemaService,
        @Inject(forwardRef(() => TagService))
        private readonly tagService: TagService
    ) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.inserir'])
    create(@Body() createPdmDto: CreatePdmDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        console.log(createPdmDto);
        return this.pdmService.create(this.tipoPdm, createPdmDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    //@Roles(['CadastroPdm.inserir', 'CadastroPdm.editar', 'CadastroPdm.inativar', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async findAll(@Query() filters: FilterPdmDto, @CurrentUser() user: PessoaFromJwt): Promise<ListPdmDto> {
        const linhas = await this.pdmService.findAll(this.tipoPdm, filters, user);
        let ciclo_fisico_ativo: CicloFisicoDto | null | undefined = undefined;
        let orcamento_config: OrcamentoConfig[] | null | undefined = undefined;

        if (filters.ativo && linhas[0] && linhas[0].id) {
            ciclo_fisico_ativo = await this.pdmService.getCicloAtivo(linhas[0].id);
            orcamento_config = await this.pdmService.getOrcamentoConfig(this.tipoPdm, linhas[0].id);
        }

        return {
            linhas: linhas,
            ciclo_fisico_ativo,
            orcamento_config,
        };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updatePdmDto: UpdatePdmDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.pdmService.update(this.tipoPdm, +params.id, updatePdmDto, user);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.inserir', 'CadastroPdm.editar', 'CadastroPdm.inativar', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiExtraModels(PdmDto, DetalhePdmDto)
    @ApiOkResponse({
        schema: { anyOf: refs(PdmDto, DetalhePdmDto) },
    })
    async get(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @Query() detail: FilterPdmDetailDto
    ): Promise<PdmDto | DetalhePdmDto> {
        const pdm = await this.pdmService.getDetail(this.tipoPdm, +params.id, user, 'ReadOnly', false);

        if (!detail.incluir_auxiliares) return pdm;

        const filter_opts = { pdm_id: +params.id };
        const [tema, sub_tema, eixo, tag, orcamento_config] = await Promise.all([
            this.objetivoEstrategicoService.findAll(this.tipoPdm, filter_opts),
            this.subTemaService.findAll(this.tipoPdm, filter_opts),
            this.eixoService.findAll(this.tipoPdm, filter_opts),
            this.tagService.findAll(this.tipoPdm, filter_opts),
            this.pdmService.getOrcamentoConfig(this.tipoPdm, +params.id),
        ]);

        return {
            pdm,
            tema,
            sub_tema,
            eixo,
            tag,
            orcamento_config,
        };
    }

    @Patch(':id/orcamento-config')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.editar'])
    async updatePdmOrcamentoConfig(
        @Param() params: FindOneParams,
        @Body() updatePdmOrcamentoConfigDto: UpdatePdmOrcamentoConfigDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId[]> {
        return await this.pdmService.updatePdmOrcamentoConfig(
            this.tipoPdm,
            +params.id,
            updatePdmOrcamentoConfigDto,
            user
        );
    }

    @Post(':id/documento')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.inserir', 'CadastroPdm.editar'])
    async upload(
        @Param() params: FindOneParams,
        @Body() createPdmDocDto: CreatePdmDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.pdmService.append_document(this.tipoPdm, params.id, createPdmDocDto, user);
    }

    @Get(':id/documento')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.inserir', 'CadastroPdm.editar'])
    async download(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListPdmDocument> {
        return { linhas: await this.pdmService.list_document(this.tipoPdm, params.id, user) };
    }

    @Patch(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.inserir', 'CadastroPdm.editar'])
    async updateDocumento(
        @Param() params: FindTwoParams,
        @Body() dto: UpdatePdmDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.pdmService.updateDocumento(this.tipoPdm, params.id, params.id2, dto, user);
    }

    @Delete(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.inserir', 'CadastroPdm.editar'])
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<void> {
        await this.pdmService.remove_document(this.tipoPdm, params.id, params.id2, user);
        return;
    }
}

const PermsPS: ListaDePrivilegios[] = [
    'CadastroPS.administrador',
    'CadastroPS.administrador_no_orgao',
    'CadastroMetaPS.listar',
];

@ApiTags('Plano Setorial')
@Controller('plano-setorial')
export class PlanoSetorialController {
    static readonly WritePerms: ListaDePrivilegios[] = PermsPS;

    constructor(private readonly pdmService: PdmService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    create(
        @Body() createPdmDto: CreatePdmDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return this.pdmService.create(tipo, createPdmDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles([...PermsPS])
    async findAll(
        @Query() filters: FilterPdmDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListPdmDto> {
        const linhas = await this.pdmService.findAll(tipo, filters, user);
        let orcamento_config: OrcamentoConfig[] | null | undefined = undefined;

        if (linhas[0] && linhas[0].id && filters.id !== undefined) {
            orcamento_config = await this.pdmService.getOrcamentoConfig(tipo, linhas[0].id);
        }

        return {
            linhas: linhas,
            orcamento_config,
        };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    async update(
        @Param() params: FindOneParams,
        @Body() updatePdmDto: UpdatePdmDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.pdmService.update(tipo, +params.id, updatePdmDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<void> {
        await this.pdmService.delete(tipo, +params.id, user);
        return;
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PermsPS, 'Reports.executar.PlanoSetorial'])
    @ApiExtraModels(PlanoSetorialDto, DetalhePSDto)
    @ApiOkResponse({
        schema: { anyOf: refs(PlanoSetorialDto, DetalhePSDto) },
    })
    async get(
        @Param() params: FindOneParams,
        @Query() detail: FilterPdmDetailDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<PlanoSetorialDto | DetalhePSDto> {
        const pdm = await this.pdmService.getDetail(tipo, +params.id, user, 'ReadOnly', detail.expandir_equipes);

        if (!detail.incluir_auxiliares) return pdm as PlanoSetorialDto;

        return {
            pdm: pdm as PlanoSetorialDto,
            orcamento_config: await this.pdmService.getOrcamentoConfig(tipo, +params.id),
        } satisfies DetalhePSDto;
    }

    @Patch(':id/orcamento-config')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    async updatePdmOrcamentoConfig(
        @Param() params: FindOneParams,
        @Body() updatePdmOrcamentoConfigDto: UpdatePdmOrcamentoConfigDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId[]> {
        return await this.pdmService.updatePdmOrcamentoConfig(tipo, +params.id, updatePdmOrcamentoConfigDto, user);
    }

    @Post(':id/documento')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    async upload(
        @Param() params: FindOneParams,
        @Body() createPdmDocDto: CreatePdmDocumentDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.pdmService.append_document(tipo, params.id, createPdmDocDto, user);
    }

    @Get(':id/documento')
    @ApiBearerAuth('access-token')
    @Roles([...PermsPS, 'PS.ponto_focal'])
    async download(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListPdmDocument> {
        return { linhas: await this.pdmService.list_document(tipo, params.id, user) };
    }

    @Patch(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    async updateDocumento(
        @Param() params: FindTwoParams,
        @Body() dto: UpdatePdmDocumentDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        await this.pdmService.getDetail(tipo, +params.id, user, 'ReadWrite', false);

        return await this.pdmService.updateDocumento(tipo, params.id, params.id2, dto, user);
    }

    @Delete(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(
        @Param() params: FindTwoParams,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<void> {
        await this.pdmService.remove_document(tipo, params.id, params.id2, user);
        return;
    }
}
