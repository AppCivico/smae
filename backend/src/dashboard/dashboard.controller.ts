import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { DashboardService } from './dashboard.service';
import { DashboardLinhasDto } from './entities/dashboard.entity';
import { Request, Response } from 'express';
import { GetDomainFromUrl } from '../auth/models/GetDomainFromUrl';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { SmaeConfigService } from 'src/common/services/smae-config.service';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.dashboard_pdm', 'Reports.dashboard_portfolios', 'SMAE.espectador_de_painel_externo'])
    async findAll(@CurrentUser() user: PessoaFromJwt, @Req() req: Request): Promise<DashboardLinhasDto> {
        const hostname = await this.smaeConfigService
            .getConfigWithDefault('API_HOST_NAME', req.hostname)
            .catch(() => req.hostname);
        return {
            linhas: await this.dashboardService.findAll(user, hostname),
        };
    }

    @Get('iframe')
    @IsPublic()
    async renderIframe(@Query() params: { url: string }, @Res() res: Response): Promise<void> {
        const url = params.url;

        const domain = GetDomainFromUrl(url);

        res.header('X-Frame-Options', `ALLOW-FROM ${domain}`);

        res.render('iframe-template', { smae: { url } });
    }
}
