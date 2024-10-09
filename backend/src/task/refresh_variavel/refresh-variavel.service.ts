import { Injectable, Logger } from '@nestjs/common';
import { RetryOperation } from '../../common/RetryOperation';
import { RetryPromise } from '../../common/retryPromise';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshVariavelDto } from './dto/create-refresh-variavel.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RefreshVariavelService implements TaskableService {
    private readonly logger = new Logger(RefreshVariavelService.name);
    constructor(private readonly prisma: PrismaService) {}

    async executeJob(inputParams: CreateRefreshVariavelDto, taskId: string): Promise<any> {
        const before = Date.now();

        this.logger.verbose(`Refreshing variavel ${inputParams.variavel_id}...`);

        const task = await this.prisma.task_queue.findFirstOrThrow({ where: { id: +taskId } });

        await this.prisma.$queryRaw`UPDATE task_queue
        SET status='completed', output = '{"duplicated": true}'
        WHERE type = 'refresh_variavel'
        AND status='pending' AND id != ${task.id}
        AND (params::text, criado_em) = (select params::text, criado_em from task_queue where id = ${task.id})
        `;

        const op = async () => {
            this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
                await prismaTx.$executeRaw`SELECT pg_advisory_xact_lock(${inputParams.variavel_id.toString()}::bigint)`;

                await prismaTx.$queryRaw`select monta_serie_variavel_calculada(${inputParams.variavel_id}::int);`;
            });
        };

        await RetryOperation(
            5,
            async () => {
                await RetryPromise(() => op.apply(this), 10, 100, 20);
            },
            async (error) => {
                this.logger.error(`Erro ao recalcular variavel: ${error}`);

                await this.prisma.variavel.update({
                    where: {
                        id: inputParams.variavel_id,
                    },
                    data: {
                        recalculando: true,
                        recalculo_erro: error.toString(),
                    },
                });

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
