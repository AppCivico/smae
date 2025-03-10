import { Body, Controller, Get, HttpException, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { CronogramaEtapaService } from '../../cronograma-etapas/cronograma-etapas.service';
import { FilterCronogramaEtapaDto } from '../../cronograma-etapas/dto/filter-cronograma-etapa.dto';
import { ListCronogramaEtapaDto } from '../../cronograma-etapas/dto/list-cronograma-etapa.dto';
import { CronogramaService } from '../../cronograma/cronograma.service';
import { FilterCronogramaDto } from '../../cronograma/dto/fillter-cronograma.dto';
import { ListCronogramaDto } from '../../cronograma/dto/list-cronograma.dto';
import { EtapaService } from '../../etapa/etapa.service';
import { MfService } from '../mf.service';
import { MfEtapaDto, RetornoMetaCronogramaDto } from './../metas/dto/mf-crono.dto';
import { MetasCronogramaService } from './../metas/metas-cronograma.service';
import { RequestInfoDto } from './dto/mf-meta.dto';

@ApiTags('Monitoramento Fisico - Cronogramas')
@Controller('metas')
export class MetasCronogramaController {
    constructor(
        private readonly cronogramaService: CronogramaService,
        private readonly cronogramaEtapaService: CronogramaEtapaService,
        private readonly metasCronogramaService: MetasCronogramaService,
        private readonly etapaService: EtapaService,
        private readonly mfService: MfService
    ) {}

    @Get('cronograma')
    @ApiBearerAuth('access-token')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    @ApiExtraModels(ListCronogramaDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(ListCronogramaDto, RequestInfoDto) },
    })
    async cronogramas(
        @Query() filters: FilterCronogramaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListCronogramaDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        filters.cronograma_etapa_ids = config.cronogramas_etapas;

        return {
            linhas: await this.cronogramaService.findAll('_PDM', filters, user),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @Get('cronograma-etapa')
    @ApiBearerAuth('access-token')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    @ApiExtraModels(ListCronogramaEtapaDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(ListCronogramaEtapaDto, RequestInfoDto) },
    })
    async cronogramas_etapas(
        @Query() filters: FilterCronogramaEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListCronogramaEtapaDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        filters.cronograma_etapa_ids = config.cronogramas_etapas;

        return {
            linhas: await this.cronogramaEtapaService.findAll('_PDM', filters, user, true),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @Patch('cronograma/etapa/:id')
    @ApiBearerAuth('access-token')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    async patch_crono_etapa(
        @Param() params: FindOneParams,
        @Body() updateEtapaDto: MfEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        const config = await this.mfService.pessoaAcessoPdm(user);

        if (config.cronogramas_etapas.includes(params.id) == false) {
            throw new HttpException('Etapa não encontrada', 404);
        }

        const ret = await this.etapaService.update('_PDM', +params.id, updateEtapaDto, user, undefined, config);

        // basicamente, todos esses valores não temos aqui
        // então o melhor é na trigger do update da etapa, apagar invalidar esse status, pq ai
        // já muda quando o admin mudar aqui
        //await this.mfService.invalidaStatusIndicador(prismaTxn, dadosCiclo.id, meta_id);

        return ret;
    }

    @Get(':id/iniciativas-e-atividades')
    @ApiBearerAuth('access-token')
    @Roles(
        ['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'],
        'Para uso apenas quando existir CRONOGRAMA na meta, se não irá voltar meta=null'
    )
    async iniciativa_atividades(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RetornoMetaCronogramaDto> {
        const config = await this.mfService.pessoaAcessoPdm(user);

        if (config.metas_cronograma.includes(params.id) == false) {
            return { meta: null };
        }

        const ret = await this.metasCronogramaService.metaIniciativaAtividadesComCrono(params.id);

        return ret;
    }
}
