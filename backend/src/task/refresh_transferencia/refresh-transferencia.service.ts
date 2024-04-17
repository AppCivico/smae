import { Injectable, Logger } from '@nestjs/common';
import { RetryPromise } from '../../common/retryPromise';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshTransferenciaDto } from './dto/create-refresh-transferencia.dto';
import { sleepFor } from '../../common/sleepFor';

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
        let tries = 0;
        do {
            try {
                tries++;
                await RetryPromise(
                    () =>
                        this.prisma.$queryRaw`
                    select atualiza_transferencia_status_consolidado(
                      ${inputParams.transferencia_id}::int
                    );
                `,
                    10,
                    100,
                    20
                );
                // sai fora do loop no sucesso
                tries = Number.MAX_SAFE_INTEGER;
            } catch (error) {
                this.logger.error(error);
                this.logger.error('Erro desconhecido, tentando novamente em 1s');
                await sleepFor(1000);
                if (tries >= 5) throw error;
            }
        } while (tries < 5); // just in case, pra n ter loop infinito

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
