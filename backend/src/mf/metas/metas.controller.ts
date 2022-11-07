import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { MfService } from '../mf.service';
import { AnaliseQualitativaDocumentoDto, AnaliseQualitativaDto, FilterAnaliseQualitativaDto, FilterMfMetaDto as ParamsMfMetaDto, ListMfMetasAgrupadasDto, ListMfMetasDto, MfListAnaliseQualitativaDto, RequestInfoDto, RetornoMetaVariaveisDto, VariavelConferidaDto } from './dto/mf-meta.dto';

import { MetasService } from './metas.service';

@ApiTags('Monitoramento Fisico - Metas e variáveis')
@Controller('metas')
export class MetasController {
    constructor(
        private readonly metasService: MetasService,
        private readonly mfService: MfService
    ) { }


    @Get('')
    @ApiBearerAuth('access-token')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(ListMfMetasDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(ListMfMetasDto, RequestInfoDto) },
    })
    async metas(
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMfMetasDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        return {
            'linhas': await this.metasService.metas(config, cicloFisicoAtivo.id),
            requestInfo: { queryTook: Date.now() - start },
            ciclo_ativo: cicloFisicoAtivo,
            perfil: config.perfil
        };
    }

    @ApiBearerAuth('access-token')
    @Get('por-fase')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(ListMfMetasAgrupadasDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(ListMfMetasAgrupadasDto, RequestInfoDto) },
    })
    async metasPorFase(
        @Query() params: ParamsMfMetaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMfMetasAgrupadasDto & RequestInfoDto> {
        const start = Date.now();
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();
        const config = await this.mfService.pessoaAcessoPdm(user);
        const ids: number[] = [
            ...(params.via_cronograma ? config.metas_cronograma : []),
            ...(params.via_variaveis ? config.metas_variaveis : []),
        ];

        return {
            'linhas': await this.metasService.metasPorFase({
                ids: ids,
            }),
            agrupador: 'Fase',
            requestInfo: { queryTook: Date.now() - start },
            ciclo_ativo: cicloFisicoAtivo,
            perfil: config.perfil
        };
    }

    @ApiBearerAuth('access-token')
    @Get('por-status')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(ListMfMetasAgrupadasDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(ListMfMetasAgrupadasDto, RequestInfoDto) },
    })
    async metasPorStatus(
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMfMetasAgrupadasDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        return {
            'linhas': await this.metasService.metasPorStatus({
                ids: config.metas_variaveis,
            }, cicloFisicoAtivo.id),
            agrupador: 'Status',
            requestInfo: { queryTook: Date.now() - start },
            ciclo_ativo: cicloFisicoAtivo,
            perfil: config.perfil
        };
    }

    @ApiBearerAuth('access-token')
    @Get(':id/variaveis')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RetornoMetaVariaveisDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RetornoMetaVariaveisDto, RequestInfoDto) },
    })
    async metaVariaveis(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RetornoMetaVariaveisDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        if (config.metas_variaveis.includes(params.id) === false)
            throw new HttpException('ID da meta não faz parte do seu perfil', 404);

        // talvez isso vire parâmetros e ao buscar os ciclos antigos não precisa calcular os status
        // todo encontrar uma maneira de listar o passado sem um ciclo ativo
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        return {
            ...await this.metasService.metaVariaveis(
                params.id,
                config,
                cicloFisicoAtivo,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }


    @ApiBearerAuth('access-token')
    @Patch('variaveis/analise-qualitativa')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaVariavelAnaliseQualitativa(
        @Body() dto: AnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        // mesma coisa, pra editar um ciclo, vamos precisar de


        return {
            ...await this.metasService.addMetaVariavelAnaliseQualitativa(
                dto,
                config,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }


    @ApiBearerAuth('access-token')
    @Get('variaveis/analise-qualitativa')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(MfListAnaliseQualitativaDto, RequestInfoDto) },
    })
    async GetMetaVariavelAnaliseQualitativa(
        @Query() dto: FilterAnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<MfListAnaliseQualitativaDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        return {
            ...await this.metasService.getMetaVariavelAnaliseQualitativa(
                dto,
                config,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Patch('variaveis/analise-qualitativa/documento')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaVariavelAnaliseQualitativaDocumento(
        @Body() dto: AnaliseQualitativaDocumentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        // mesma coisa, pra editar um ciclo, vamos precisar de

        return {
            ...await this.metasService.addMetaVariavelAnaliseQualitativaDocumento(
                dto,
                config,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Delete('variaveis/analise-qualitativa/documento/:id')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async DeleteMetaVariavelAnaliseQualitativaDocumento(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ) {
        const config = await this.mfService.pessoaAcessoPdm(user);
        await this.metasService.deleteMetaVariavelAnaliseQualitativaDocumento(
            params.id,
            config,
            user
        );

        return '';
    }


    @ApiBearerAuth('access-token')
    @Patch('variaveis/conferida')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async AddVariavelConferida(
        @Body() dto: VariavelConferidaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        const config = await this.mfService.pessoaAcessoPdm(user);

        await this.metasService.addVariavelConferida(
            dto,
            config,
            user
        );

        return '';
    }



}
