import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { FilterCronogramaEtapaDto } from 'src/cronograma-etapas/dto/filter-cronograma-etapa.dto';
import { ListCronogramaEtapaDto } from 'src/cronograma-etapas/dto/list-cronograma-etapa.dto';
import { CronogramaService } from 'src/cronograma/cronograma.service';
import { FilterCronogramaDto } from 'src/cronograma/dto/fillter-cronograma.dto';
import { ListCronogramaDto } from 'src/cronograma/dto/list-cronograma.dto';
import { MfService } from '../mf.service';
import { RequestInfoDto } from './dto/mf-meta.dto';


@ApiTags('Monitoramento Fisico - Cronogramas')
@Controller('metas')
export class MetasCronogramaController {
    constructor(
        private readonly cronogramaService: CronogramaService,
        private readonly cronogramaEtapaService: CronogramaEtapaService,
        private readonly mfService: MfService
    ) { }


    @Get('cronograma')
    @ApiBearerAuth('access-token')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
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
            'linhas': await this.cronogramaService.findAll(filters),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @Get('cronograma-etapa')
    @ApiBearerAuth('access-token')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
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
            'linhas': await this.cronogramaEtapaService.findAll(filters),
            requestInfo: { queryTook: Date.now() - start },
        };
    }


}
