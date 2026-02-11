import { Controller, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AtualizacaoEmLoteService } from '../../atualizacao-em-lote/atualizacao-em-lote.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';

@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
@Controller()
export class SysadminAtualizacaoController {
    constructor(
        @Inject(AtualizacaoEmLoteService)
        private readonly atualizacaoEmLoteService: AtualizacaoEmLoteService
    ) {}

    @Post('atualizacao-em-lote/sync-operacoes-processadas')
    @Roles(['SMAE.superadmin'], 'Sincroniza operações processadas de atualização em lote')
    @ApiResponse({ status: 201, description: 'Sincronização concluída' })
    async syncOperacoesProcessadas(
        @CurrentUser() user: PessoaFromJwt
    ): Promise<{ message: string; stats: { total: number; updated: number; errors: number } }> {
        const stats = await this.atualizacaoEmLoteService.syncOperacoesProcessadas();

        return {
            message: `Sincronização completa. ${stats.updated} de ${stats.total} registros foram atualizados com sucesso. ${stats.errors} erros ocorreram.`,
            stats,
        };
    }
}
