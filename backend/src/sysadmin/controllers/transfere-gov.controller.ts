import { Controller, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TransfereGovSyncService } from '../../transfere-gov-sync/transfere-gov-sync.service';
import { TransfereGovSyncDto } from '../dto/transfere-gov/transfere-gov-sync.dto';

@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
@Controller()
export class SysadminTransfereGovController {
    constructor(
        @Inject(TransfereGovSyncService)
        private readonly transfereGovSyncService: TransfereGovSyncService
    ) {}

    /**
     * Sincroniza comunicados do TransfereGov manualmente
     */
    @Post('transfere-gov/sync')
    @Roles(['TransfereGov.sincronizar'])
    @ApiOperation({
        summary: 'Sincroniza comunicados do TransfereGov',
        description: 'Executa sincronização manual dos comunicados da plataforma TransfereGov',
    })
    @ApiResponse({ status: 201, description: 'Sincronização concluída' })
    async manualSync(): Promise<TransfereGovSyncDto> {
        const newItems = await this.transfereGovSyncService.manualSync();
        return { novos_itens: newItems.map((item) => item.id) };
    }

    /**
     * Sincroniza transferências especiais do TransfereGov
     */
    @Post('transfere-gov/sync-transferencias-especiais')
    @Roles(['TransfereGov.sincronizar'])
    @ApiOperation({
        summary: 'Sincroniza transferências especiais do TransfereGov',
        description: 'Executa sincronização manual das transferências especiais (oportunidades especiais)',
    })
    @ApiResponse({ status: 201, description: 'Sincronização concluída' })
    async manualSyncOportunidadesEspeciais(): Promise<TransfereGovSyncDto> {
        const newItems = await this.transfereGovSyncService.manualSyncOportunidadesEspeciais();
        return { novos_itens: newItems.map((item) => item.id) };
    }

    /**
     * Sincroniza todas as transferências do TransfereGov
     */
    @Post('transfere-gov/sync-transferencias-completo')
    @Roles(['TransfereGov.sincronizar'])
    @ApiOperation({
        summary: 'Sincroniza todas as transferências do TransfereGov',
        description: 'Executa sincronização completa de todas as transferências disponíveis',
    })
    @ApiResponse({ status: 201, description: 'Sincronização concluída' })
    async manualSyncTransferencias(): Promise<TransfereGovSyncDto> {
        const newItems = await this.transfereGovSyncService.manualSyncTransferencias();
        return { novos_itens: newItems.map((item) => item.id) };
    }
}
