import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
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
        private readonly mfService: MfService
    ) { }


    @Get('cronogramas')
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


}
