import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { DashboardLinhasDto } from './entities/dashboard.entity';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @Roles('Reports.dashboard_pdm', 'Reports.dashboard_portfolios', 'SMAE.espectador_de_painel_externo')
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<DashboardLinhasDto> {
        return {
            linhas: await this.dashboardService.findAll(user),
        };
    }
}
