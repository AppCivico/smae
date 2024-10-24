import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { RequestInfoDto } from '../../mf/metas/dto/mf-meta.dto';
import { FilterDashNotasDto, MfDashNotasDto } from './dto/notas.dto';
import {
    DashAnaliseTranferenciasChartsDto,
    FilterDashTransferenciasAnaliseDto,
    FilterDashTransferenciasDto,
    ListMfDashTransferenciasDto,
} from './dto/transferencia.dto';
import { DashTransferenciaService } from './transferencia.service';

@ApiTags('Transferências')
@Controller('panorama')
export class DashTransferenciaController {
    constructor(private readonly metasDashService: DashTransferenciaService) {}

    @Get('transferencias')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    @ApiExtraModels(ListMfDashTransferenciasDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(ListMfDashTransferenciasDto, RequestInfoDto) },
    })
    async transferencias(
        @Query() params: FilterDashTransferenciasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMfDashTransferenciasDto & RequestInfoDto> {
        const start = Date.now();

        const transferencias = await this.metasDashService.transferencias(params, user);

        return {
            ...transferencias,
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @Get('notas')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    @ApiExtraModels(MfDashNotasDto)
    async notas(
        @Query() params: FilterDashNotasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedDto<MfDashNotasDto>> {
        return await this.metasDashService.notas(params, user);
    }

    @Get('analise-transferencias')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.dashboard'])
    async analiseTranferencias(
        @Query() params: FilterDashTransferenciasAnaliseDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DashAnaliseTranferenciasChartsDto & RequestInfoDto> {
        const start = Date.now();

        const analiseTransferencias = await this.metasDashService.analiseTransferenciasFormattedCharts(params, user);

        return {
            ...analiseTransferencias,
            requestInfo: { queryTook: Date.now() - start },
        };
    }
}
