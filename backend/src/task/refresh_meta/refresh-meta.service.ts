import { Injectable, Logger } from '@nestjs/common';
import { RetryOperation } from '../../common/RetryOperation';
import { RetryPromise } from '../../common/retryPromise';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshMetaDto } from './dto/create-refresh-mv.dto';

@Injectable()
export class RefreshMetaService implements TaskableService {
    private readonly logger = new Logger(RefreshMetaService.name);
    constructor(private readonly prisma: PrismaService) {}

    async executeJob(inputParams: CreateRefreshMetaDto, taskId: string): Promise<any> {
        const before = Date.now();

        this.logger.verbose(`Refreshing meta ${inputParams.meta_id}...`);

        const task = await this.prisma.task_queue.findFirstOrThrow({ where: { id: +taskId } });

        await this.prisma.$queryRaw`UPDATE task_queue
        SET status='completed', output = '{"duplicated": true}'
        WHERE type = 'refresh_meta'
        AND status='pending' AND id != ${task.id}
        AND (params->>'meta_id')::int = ${inputParams.meta_id}::int
        AND criado_em = (select criado_em from task_queue where id = ${task.id})
        `;

        await RetryOperation(
            5,
            async () => {
                await this.prisma.$transaction(async (tx) => {
                    // Executa o procedimento que atualiza a meta
                    await RetryPromise(
                        () =>
                            tx.$queryRaw`select atualiza_meta_status_consolidado(
                        ${inputParams.meta_id}::int,
                        (select id from ciclo_fisico where ativo and tipo='PDM')
                    );`,
                        10,
                        100,
                        20
                    );

                    // Se chegou aqui com sucesso, apaga os jobs antigos que deram sucesso ou estão pendentes
                    await tx.$queryRaw`DELETE FROM task_queue
                        WHERE type = 'refresh_meta'
                        AND status IN ('pending', 'completed')
                        AND id != ${task.id}
                        AND (params->>'meta_id')::int = ${inputParams.meta_id}::int
                        AND criado_em < (SELECT criado_em FROM task_queue WHERE id = ${task.id})`;
                });
            },
            async (error) => {
                this.logger.error(`Erro ao recalcular meta: ${error}`);
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
