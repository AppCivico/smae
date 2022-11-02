import { Controller, Get, HttpException, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOkResponse, ApiResponse, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { MfService } from '../mf.service';
import { FilterMfMetaDto as ParamsMfMetaDto, ListMfMetasAgrupadasDto, RequestInfoDto, RetornoMetaVariaveisDto } from './dto/mf-meta.dto';

import { MetasService } from './metas.service';

@Controller('metas')
export class MetasController {
    constructor(
        private readonly metasService: MetasService,
        private readonly mfService: MfService
    ) { }


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




}
