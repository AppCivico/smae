import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshCachePdmDto } from './dto/create-refresh-cache-pdm.dto';

// Limpa o cache de acesso / status de meta do PDM legado. A tarefa é enfileirada pelos triggers deferidos do
// 0062 (uma linha por transação que mexeu em dado do PDM legado), assim quem escreve não toca nas tabelas de cache.
@Injectable()
export class RefreshCachePdmService implements TaskableService {
    private readonly logger = new Logger(RefreshCachePdmService.name);
    constructor(private readonly prisma: PrismaService) {}

    async executeJob(inputParams: CreateRefreshCachePdmDto, taskId: string): Promise<any> {
        const before = Date.now();

        const ret = await this.prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                // junta as pendentes nesta execução: a linha só é visível depois do COMMIT de quem a criou, então
                // os DELETEs abaixo (que rodam depois deste SELECT) já enxergam as mudanças de todas elas
                const pendentes = await tx.$queryRaw<{ id: number; params: CreateRefreshCachePdmDto }[]>`
                    SELECT id, params FROM task_queue
                    WHERE type = 'refresh_cache_pdm' AND status = 'pending' AND id != ${+taskId}::int
                    FOR UPDATE SKIP LOCKED`;

                const todas = [inputParams, ...pendentes.map((p) => p.params)];
                const acesso = todas.some((p) => p?.acesso);
                const statusMeta = todas.some((p) => p?.status_meta);

                if (pendentes.length) {
                    await tx.$executeRaw`DELETE FROM task_queue WHERE id = ANY(${pendentes.map((p) => p.id)}::int[])`;
                }

                if (acesso) {
                    await tx.$executeRaw`DELETE FROM pessoa_acesso_pdm_valido`;
                    await tx.$executeRaw`DELETE FROM pessoa_acesso_pdm`;
                }
                if (statusMeta) {
                    await tx.$executeRaw`DELETE FROM status_meta_ciclo_fisico`;
                }

                return { acesso, status_meta: statusMeta, agrupadas: pendentes.length };
            },
            { isolationLevel: 'ReadCommitted', maxWait: 15000, timeout: 60000 }
        );

        const took = Date.now() - before;
        this.logger.verbose(`Cache do PDM legado limpo em ${took}ms: ${JSON.stringify(ret)}`);
        return { success: true, took, ...ret };
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
