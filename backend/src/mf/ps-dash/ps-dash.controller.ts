import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { MetaSetorialController } from '../../meta/meta.controller';
import {
    PSMFFiltroDashboardMetasDto,
    PSMFFiltroDashboardQuadroDto,
    PSMFFiltroDashboardQuadroVariaveisDto,
    PSMFListaMetasDto,
    PSMFQuadroMetasDto,
    PSMFQuadroVariaveisDto,
} from './dto/ps.dto';
import { PSMFDashboardService } from './ps-dash.service';
import { TipoPDM, TipoPdmType } from '../../common/decorators/current-tipo-pdm';

@ApiTags('Plano Setorial - Dashboard')
@Controller('plano-setorial/panorama')
export class PSMFDashboardController {
    constructor(private readonly dashboardService: PSMFDashboardService) {}

    @Get('quadro-variaveis')
    @ApiOperation({ summary: 'Retorna o quadro de variáveis do panorama' })
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async getQuadroVariaveis(
        @Query() filtros: PSMFFiltroDashboardQuadroVariaveisDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<PSMFQuadroVariaveisDto> {
        return await this.dashboardService.getQuadroVariaveis(tipo, filtros, user);
    }

    @Get('quadro-metas')
    @ApiOperation({ summary: 'Retorna as estatísticas de metas do panorama' })
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async getQuadroMetas(
        @Query() filtros: PSMFFiltroDashboardQuadroDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<PSMFQuadroMetasDto> {
        return await this.dashboardService.getQuadroMetasIniAtv(tipo, filtros, user);
    }

    @Get('metas')
    @ApiOperation({ summary: 'Retorna a lista paginada de metas do panorama' })
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async getListaMetasIniAtv(
        @Query() filtros: PSMFFiltroDashboardMetasDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<PSMFListaMetasDto> {
        return await this.dashboardService.getListaMetasIniAtv(tipo, filtros, user);
    }
}
