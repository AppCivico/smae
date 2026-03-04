import { Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EquipeRespService } from '../../equipe-resp/equipe-resp.service';

@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
@Controller()
export class SysadminEquipeRespController {
    constructor(private readonly equipeRespService: EquipeRespService) {}

    @Post('equipe-responsavel/recalc-perfis')
    @Roles(['SMAE.superadmin'], 'Recalcula perfis de equipe de todas as pessoas')
    @ApiOperation({
        summary: 'Recalcula perfis_equipe_pdm e perfis_equipe_ps de todas as pessoas ativas',
    })
    @ApiResponse({ status: 201, description: 'Recálculo concluído' })
    async recalcPerfis() {
        const result = await this.equipeRespService.recalcFullDb();
        return {
            message: 'Recálculo de perfis de equipe concluído',
            updated: result.updated,
            total: result.total,
        };
    }
}
