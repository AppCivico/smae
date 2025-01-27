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
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { BatchRecordWithId, RecordWithId } from '../../common/dto/record-with-id.dto';
import { MfService } from '../mf.service';
import {
    CicloFaseDto,
    FilterFormulaCompostaAnaliseQualitativaDto,
    FilterMfMetasDto,
    FilterMfVariaveis,
    FilterVariavelAnaliseQualitativaDto,
    FilterVariavelAnaliseQualitativaEmLoteDto,
    FormulaCompostaAnaliseQualitativaDocumentoDto,
    FormulaCompostaAnaliseQualitativaDto,
    ListMfMetasDto,
    MfListFormulaCompostaAnaliseQualitativaDto,
    MfListVariavelAnaliseQualitativaDto,
    MfListVariavelAnaliseQualitativaEmLoteDto,
    MfListVariavelAnaliseQualitativaReducedDto,
    RequestInfoDto,
    RetornoMetaVariaveisDto,
    VariavelAnaliseQualitativaDocumentoDto,
    VariavelAnaliseQualitativaDto,
    VariavelAnaliseQualitativaEmLoteDto,
    VariavelComplementacaoDto,
    VariavelConferidaDto,
    VariavelPedidoComplementacaoEmLoteDto,
} from './dto/mf-meta.dto';

import { CheckArrayContains } from '../../common/helpers/CheckArrayContains';
import { MetaService } from '../../meta/meta.service';
import { MetasService } from './metas.service';

const DISP_ENDPOINT_MONIT = 'Variáveis disponíveis apenas durante o monitoramento físico';
const DISP_ENDPOINT_MONIT_E_ADMIN =
    'Variáveis disponíveis apenas durante o monitoramento físico ou ter e Admin CP/Tecnico CP';

@ApiTags('Monitoramento Fisico - Metas e variáveis')
@Controller('metas')
export class MetasController {
    constructor(
        private readonly metasService: MetasService,
        private readonly metaService: MetaService,
        private readonly mfService: MfService
    ) {}

    @Get('')
    @ApiBearerAuth('access-token')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiExtraModels(ListMfMetasDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(ListMfMetasDto, RequestInfoDto) },
    })
    async metas(
        @Query() params: FilterMfMetasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMfMetasDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        return {
            linhas: await this.metasService.metas(config, cicloFisicoAtivo.id, params),
            requestInfo: { queryTook: Date.now() - start },
            ciclo_ativo: cicloFisicoAtivo,
            perfil: config.perfil,
        };
    }

    @ApiBearerAuth('access-token')
    @Get(':id/variaveis')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiExtraModels(RetornoMetaVariaveisDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RetornoMetaVariaveisDto, RequestInfoDto) },
    })
    async metaVariaveis(
        @Param() params: FindOneParams,
        @Query() opts: FilterMfVariaveis,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RetornoMetaVariaveisDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        if (!CheckArrayContains(params.id, config.metas_variaveis))
            throw new HttpException(
                `Meta ID=${params.id} não faz parte do seu perfil.\nConfiguração Atual: ${JSON.stringify(config)}`,
                404
            );

        // talvez isso vire parâmetros e ao buscar os ciclos antigos não precisa calcular os status
        // todo encontrar uma maneira de listar o passado sem um ciclo ativo
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();
        if (opts.simular_ponto_focal && config.perfil !== 'ponto_focal') {
            config.perfil = 'ponto_focal';
        }
        const mesAnterior = opts.mes_anterior !== undefined ? opts.mes_anterior : false;

        return {
            ...(await this.metasService.metaVariaveis(params.id, config, cicloFisicoAtivo, user, mesAnterior)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Patch('variaveis/analise-qualitativa')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaVariavelAnaliseQualitativa(
        @Body() dto: VariavelAnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        // mesma coisa, pra editar um ciclo, vamos precisar de

        return {
            ...(await this.metasService.addMetaVariavelAnaliseQualitativa(dto, config, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Patch('variaveis/analise-qualitativa-em-lote')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaVariavelAnaliseQualitativaEmLote(
        @Body() dto: VariavelAnaliseQualitativaEmLoteDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<BatchRecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        // mesma coisa, pra editar um ciclo, vamos precisar de

        return {
            ...(await this.metasService.addMetaVariavelAnaliseQualitativaEmLote(dto, config, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Get('variaveis/analise-qualitativa')
    @Roles(
        [
            'PDM.admin_cp',
            'PDM.tecnico_cp',
            'PDM.ponto_focal',
            'CadastroMeta.administrador_no_pdm',
            'CadastroMeta.administrador_no_pdm_admin_cp',
        ],
        DISP_ENDPOINT_MONIT_E_ADMIN
    )
    @ApiExtraModels(MfListVariavelAnaliseQualitativaDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(MfListVariavelAnaliseQualitativaDto, RequestInfoDto) },
    })
    async GetMetaVariavelAnaliseQualitativa(
        @Query() dto: FilterVariavelAnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<MfListVariavelAnaliseQualitativaDto & RequestInfoDto> {
        const start = Date.now();

        if (!user.hasSomeRoles(['CadastroMeta.administrador_no_pdm', 'CadastroMeta.administrador_no_pdm_admin_cp'])) {
            const config = await this.mfService.pessoaAcessoPdm(user);
            if (!CheckArrayContains(dto.variavel_id, config.variaveis)) {
                throw new HttpException(
                    `Variável ID=${dto.variavel_id} não faz parte do seu perfil atual.\nConfiguração Atual: ${JSON.stringify(config)}`,
                    404
                );
            }
        } else if (!user.hasSomeRoles(['CadastroMeta.administrador_no_pdm'])) {
            // logo é tem que ser admin_cp
            await this.metaService.assertMetaWriteOrThrow('_PDM', dto.variavel_id, user, 'readonly');
        }

        return {
            ...(await this.metasService.getMetaVariavelAnaliseQualitativa(dto, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Post('variaveis/busca-analise-qualitativa')
    @Roles(
        [
            'PDM.admin_cp',
            'PDM.tecnico_cp',
            'PDM.ponto_focal',
            'CadastroMeta.administrador_no_pdm',
            'CadastroMeta.administrador_no_pdm_admin_cp',
        ],
        'Retorna informações das variaveis, última análise qualitativa e arquivos em lote, não retorna série valores. ' +
            DISP_ENDPOINT_MONIT_E_ADMIN
    )
    @ApiExtraModels(
        MfListVariavelAnaliseQualitativaEmLoteDto,
        MfListVariavelAnaliseQualitativaReducedDto,
        RequestInfoDto
    )
    @ApiOkResponse({
        schema: { allOf: refs(MfListVariavelAnaliseQualitativaEmLoteDto, RequestInfoDto) },
    })
    async BuscaMetaVariavelAnaliseQualitativaEmLote(
        @Body() dto: FilterVariavelAnaliseQualitativaEmLoteDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<MfListVariavelAnaliseQualitativaEmLoteDto & RequestInfoDto> {
        const start = Date.now();

        if (!user.hasSomeRoles(['CadastroMeta.administrador_no_pdm', 'CadastroMeta.administrador_no_pdm_admin_cp'])) {
            const config = await this.mfService.pessoaAcessoPdm(user);
            for (const item of dto.linhas) {
                if (!CheckArrayContains(item.variavel_id, config.variaveis)) {
                    throw new HttpException(
                        `Variável ID=${item.variavel_id} não faz parte do seu perfil.\nConfiguração Atual: ${JSON.stringify(
                            config
                        )}`,
                        404
                    );
                }
            }
        } else if (!user.hasSomeRoles(['CadastroMeta.administrador_no_pdm'])) {
            // logo é tem que ser admin_cp
            for (const item of dto.linhas) {
                await this.metaService.assertMetaWriteOrThrow('_PDM', item.variavel_id, user, 'readonly');
            }
        }

        return {
            ...(await this.metasService.getMetaVariavelAnaliseQualitativaEmLote(dto, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Patch('variaveis/analise-qualitativa/documento')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaVariavelAnaliseQualitativaDocumento(
        @Body() dto: VariavelAnaliseQualitativaDocumentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        // mesma coisa, pra editar um ciclo, vamos precisar de

        return {
            ...(await this.metasService.addMetaVariavelAnaliseQualitativaDocumento(dto, config, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Delete('variaveis/analise-qualitativa/documento/:id')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async DeleteMetaVariavelAnaliseQualitativaDocumento(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ) {
        const config = await this.mfService.pessoaAcessoPdm(user);
        await this.metasService.deleteMetaVariavelAnaliseQualitativaDocumento(params.id, config, user);

        return '';
    }

    @ApiBearerAuth('access-token')
    @Patch('variaveis/conferida')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async AddVariavelConferida(@Body() dto: VariavelConferidaDto, @CurrentUser() user: PessoaFromJwt) {
        const config = await this.mfService.pessoaAcessoPdm(user);

        await this.metasService.addVariavelConferida(dto, config, user);

        return '';
    }

    @ApiBearerAuth('access-token')
    @Patch('variaveis/complemento')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async AddVariavelPedidoComplementacao(@Body() dto: VariavelComplementacaoDto, @CurrentUser() user: PessoaFromJwt) {
        const config = await this.mfService.pessoaAcessoPdm(user);

        await this.metasService.addVariavelPedidoComplementacao(dto, config, user);

        return '';
    }

    @ApiBearerAuth('access-token')
    @Patch('variaveis/complemento-em-lote')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async AddVariavelPedidoComplementacaoEmLote(
        @Body() dto: VariavelPedidoComplementacaoEmLoteDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        const config = await this.mfService.pessoaAcessoPdm(user);

        await this.metasService.addVariavelPedidoComplementacaoEmLote(dto, config, user);

        return '';
    }

    @ApiBearerAuth('access-token')
    @Patch(':id/fase')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async MudarMetaCicloFase(
        @Param() params: FindOneParams,
        @Body() dto: CicloFaseDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        const config = await this.mfService.pessoaAcessoPdm(user);

        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        await this.metasService.mudarMetaCicloFase(params.id, dto, config, cicloFisicoAtivo, user);

        return '';
    }

    @ApiBearerAuth('access-token')
    @Patch('formula-composta/analise-qualitativa')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaFormulaCompostaAnaliseQualitativa(
        @Body() dto: FormulaCompostaAnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        return {
            ...(await this.metasService.addMetaFormulaCompostaAnaliseQualitativa(dto, config, cicloFisicoAtivo, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Get('formula-composta/analise-qualitativa')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiExtraModels(MfListFormulaCompostaAnaliseQualitativaDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(MfListFormulaCompostaAnaliseQualitativaDto, RequestInfoDto) },
    })
    async GetMetaFormulaCompostaAnaliseQualitativa(
        @Query() dto: FilterFormulaCompostaAnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<MfListFormulaCompostaAnaliseQualitativaDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        return {
            ...(await this.metasService.getMetaFormulaCompostaAnaliseQualitativa(dto, config, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Patch('formula-composta/analise-qualitativa/documento')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaFormulaCompostaAnaliseQualitativaDocumento(
        @Body() dto: FormulaCompostaAnaliseQualitativaDocumentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        return {
            ...(await this.metasService.addMetaFormulaCompostaAnaliseQualitativaDocumento(
                dto,
                config,
                cicloFisicoAtivo,
                user
            )),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Delete('formula-composta/analise-qualitativa/documento/:id')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'], DISP_ENDPOINT_MONIT)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async DeleteMetaFormulaCompostaAnaliseQualitativaDocumento(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ) {
        const config = await this.mfService.pessoaAcessoPdm(user);

        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        await this.metasService.deleteMetaFormulaCompostaAnaliseQualitativaDocumento(
            params.id,
            config,
            cicloFisicoAtivo,
            user
        );

        return '';
    }
}
