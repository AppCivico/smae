import { Injectable, Logger } from '@nestjs/common';
import { RetryOperation } from '../../common/RetryOperation';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshMetaOrcamentoConsolidadoDto } from './dto/create-refresh-meta-orcamento-consolidado.dto';

@Injectable()
export class RefreshMetaOrcamentoConsolidadoService implements TaskableService {
    private readonly logger = new Logger(RefreshMetaOrcamentoConsolidadoService.name);
    constructor(private readonly prisma: PrismaService) {}

    async executeJob(inputParams: CreateRefreshMetaOrcamentoConsolidadoDto, taskId: string): Promise<any> {
        const before = Date.now();

        this.logger.verbose(`Refreshing meta orcamento consolidado ${inputParams.meta_id}...`);

        const task = await this.prisma.task_queue.findFirstOrThrow({ where: { id: +taskId } });

        await this.prisma.$queryRaw`UPDATE task_queue
        SET status='completed', output = '{"duplicated": true}'
        WHERE type = 'refresh_meta_orcamento_consolidado'
        AND status='pending' AND id != ${task.id}
        AND (params->>'meta_id')::int = ${inputParams.meta_id}::int
        AND criado_em = (select criado_em from task_queue where id = ${task.id})
        `;

        await RetryOperation(
            5,
            async () => {
                await this.prisma.$transaction(async (tx) => {
                    await tx.$queryRaw`SELECT f_refresh_meta_orcamento_consolidado(${inputParams.meta_id}::int)`;

                    await tx.$queryRaw`DELETE FROM task_queue
                        WHERE type = 'refresh_meta_orcamento_consolidado'
                        AND status IN ('pending', 'completed')
                        AND id != ${task.id}
                        AND (params->>'meta_id')::int = ${inputParams.meta_id}::int
                        AND criado_em < (SELECT criado_em FROM task_queue WHERE id = ${task.id})`;
                });
            },
            async (error) => {
                this.logger.error(`Erro ao recalcular meta orcamento consolidado: ${error}`);
                throw error;
            }
        );

        const took = Date.now() - before;
        return {
            success: true,
            took,
        };
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
