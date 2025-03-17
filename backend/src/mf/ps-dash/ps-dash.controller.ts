import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MetaSetorialController } from '../../meta/meta.controller';
import { PSMFFiltroDashboardQuadroDto, PSMFRespostaDashboardDto } from './dto/ps.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PSMFDashboardService } from './ps-dash.service';

@ApiTags('Plano Setorial - Dashboard')
@Controller('plano-setorial/panorama')
export class PSMFDashboardController {
    constructor(private readonly dashboardService: PSMFDashboardService) {}

    @Get('tudo-duma-vez-por-enquanto')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async getDashboardQuadros(
        @Query() filtros: PSMFFiltroDashboardQuadroDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PSMFRespostaDashboardDto> {
        return await this.dashboardService.getDashboardQuadros(filtros, user);
    }
}
