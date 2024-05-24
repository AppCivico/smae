import { Injectable, Logger } from '@nestjs/common';
import { RetryOperation } from '../../common/RetryOperation';
import { RetryPromise } from '../../common/retryPromise';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshTransferenciaDto } from './dto/create-refresh-transferencia.dto';

@Injectable()
export class RefreshTransferenciaService implements TaskableService {
    private readonly logger = new Logger(RefreshTransferenciaService.name);
    constructor(private readonly prisma: PrismaService) {}

    async executeJob(inputParams: CreateRefreshTransferenciaDto, taskId: string): Promise<any> {
        const before = Date.now();

        this.logger.verbose(`Refreshing transferencia ${inputParams.transferencia_id}...`);

        const task = await this.prisma.task_queue.findFirstOrThrow({ where: { id: +taskId } });

        await this.prisma.$queryRaw`UPDATE task_queue
        SET status='completed', output = '{"duplicated": true}'
        WHERE type = 'refresh_transferencia'
        AND status='pending' AND id != ${task.id}
        AND (params::text, criado_em) = (select params::text, criado_em from task_queue where id = ${task.id})
        `;

        await RetryOperation(
            5,
            async () => {
                await RetryPromise(
                    () =>
                        this.prisma.$queryRaw`select atualiza_transferencia_status_consolidado(
                            ${inputParams.transferencia_id}::int
                          );`,
                    10,
                    100,
                    20
                );
            },
            async (error) => {
                this.logger.error(`Erro ao recalcular transferencia: ${error}`);

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
