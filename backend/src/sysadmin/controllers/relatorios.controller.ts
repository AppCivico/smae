import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ReportsService } from '../../reports/relatorios/reports.service';

@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
@Controller()
export class SysadminRelatoriosController {
    constructor(
        @Inject(ReportsService)
        private readonly reportsService: ReportsService
    ) {}

    /**
     * Sincroniza parâmetros dos relatórios
     * Atualiza a configuração de parâmetros disponíveis para geração de relatórios
     */
    @Get('relatorios/sync-parametros')
    @Roles(['SMAE.superadmin'], 'Sincroniza parâmetros dos relatórios')
    @ApiResponse({ status: 200, description: 'Sincronização concluída' })
    async syncParametros() {
        await this.reportsService.syncRelatoriosParametros();
        return '';
    }
}
