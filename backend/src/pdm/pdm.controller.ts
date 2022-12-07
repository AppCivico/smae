import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, ApiUnauthorizedResponse, refs } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { EixoService } from '../eixo/eixo.service';
import { ObjetivoEstrategicoService } from '../objetivo-estrategico/objetivo-estrategico.service';
import { CicloFisicoDto, ListPdmDto, OrcamentoConfig } from './dto/list-pdm.dto';
import { Pdm } from './dto/pdm.dto';
import { UpdatePdmDto } from './dto/update-pdm.dto';
import { SubTemaService } from '../subtema/subtema.service';
import { TagService } from '../tag/tag.service';
import { CreatePdmDocumentDto } from './dto/create-pdm-document.dto';
import { CreatePdmDto } from './dto/create-pdm.dto';
import { DetalhePdmDto } from './dto/detalhe-pdm.dto';
import { FilterPdmDetailDto, FilterPdmDto } from './dto/filter-pdm.dto';
import { UpdatePdmOrcamentoConfigDto } from './dto/update-pdm-orcamento-config.dto';
import { ListPdmDocument } from './entities/list-pdm-document.entity';
import { PdmService } from './pdm.service';

@ApiTags('PDM')
@Controller('pdm')
export class PdmController {
    constructor(
        private readonly pdmService: PdmService,
        private readonly objetivoEstrategicoService: ObjetivoEstrategicoService,
        private readonly subTemaService: SubTemaService,
        private readonly eixoService: EixoService,
        private readonly tagService: TagService
    ) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.inserir')
    create(@Body() createPdmDto: CreatePdmDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        console.log(createPdmDto)
        return this.pdmService.create(createPdmDto, user);
    }


    @ApiBearerAuth('access-token')
    @Get()
    //@Roles('CadastroPdm.inserir', 'CadastroPdm.editar', 'CadastroPdm.inativar')
    async findAll(@Query() filters: FilterPdmDto): Promise<ListPdmDto> {

        const linhas = await this.pdmService.findAll(filters);
        let ciclo_fisico_ativo: CicloFisicoDto | null | undefined = undefined;
        let orcamento_config: OrcamentoConfig[] | null | undefined = undefined;

        if (filters.ativo && linhas[0] && linhas[0].id) {
            ciclo_fisico_ativo = await this.pdmService.getCicloAtivo(linhas[0].id);
            orcamento_config = await this.pdmService.getOrcamentoConfig(linhas[0].id);
        }

        return {
            'linhas': linhas,
            ciclo_fisico_ativo,
            orcamento_config,
        };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.editar')
    async update(@Param() params: FindOneParams, @Body() updatePdmDto: UpdatePdmDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.pdmService.update(+params.id, updatePdmDto, user);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.inserir', 'CadastroPdm.editar', 'CadastroPdm.inativar')
    @ApiExtraModels(Pdm, DetalhePdmDto)
    @ApiOkResponse({
        schema: { anyOf: refs(Pdm, DetalhePdmDto) },
    })
    async get(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @Query() detail: FilterPdmDetailDto): Promise<Pdm | DetalhePdmDto> {
        const pdm = await this.pdmService.getDetail(+params.id, user);

        if (!detail.incluir_auxiliares)
            return pdm;

        const filter_opts = { pdm_id: +params.id };
        const [tema, sub_tema, eixo, tag, orcamento_config] = await Promise.all([
            this.objetivoEstrategicoService.findAll(filter_opts),
            this.subTemaService.findAll(filter_opts),
            this.eixoService.findAll(filter_opts),
            this.tagService.findAll(filter_opts),
            this.pdmService.getOrcamentoConfig(+params.id)
        ]);

        return {
            pdm, tema, sub_tema, eixo, tag, orcamento_config
        }
    }

    @Patch(':id/orcamento-config')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.editar')
    async updatePdmOrcamentoConfig(@Param() params: FindOneParams, @Body() updatePdmOrcamentoConfigDto: UpdatePdmOrcamentoConfigDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId[]> {
        return await this.pdmService.updatePdmOrcamentoConfig(+params.id, updatePdmOrcamentoConfigDto);
    }

    @Post(':id/documento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.inserir', 'CadastroPdm.editar')
    async upload(
        @Param() params: FindOneParams,
        @Body() createPdmDocDto: CreatePdmDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {

        return await this.pdmService.append_document(params.id, createPdmDocDto, user);
    }

    @Get(':id/documento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.inserir', 'CadastroPdm.editar')
    async download(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPdmDocument> {

        return { linhas: await this.pdmService.list_document(params.id, user) };
    }

    @Delete(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles('CadastroPdm.inserir', 'CadastroPdm.editar')
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(
        @Param() params: FindTwoParams,
        @CurrentUser() user: PessoaFromJwt
    ) {
        await this.pdmService.remove_document(params.id, params.id2, user)
        return null;
    }
}
