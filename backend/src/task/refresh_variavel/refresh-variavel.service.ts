import { Injectable, Logger } from '@nestjs/common';
import { RetryOperation } from '../../common/RetryOperation';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshVariavelDto } from './dto/create-refresh-variavel.dto';
import { VariavelService } from '../../variavel/variavel.service';

@Injectable()
export class RefreshVariavelService implements TaskableService {
    private readonly logger = new Logger(RefreshVariavelService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly variavelService: VariavelService
    ) {}

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

        const variavel = await this.prisma.variavel.findFirst({
            where: { id: inputParams.variavel_id },
            select: {
                id: true,
                tipo: true,
            },
        });
        if (!variavel) return { success: false, error: 'Variável não encontrada' };

        await RetryOperation(
            5,
            () => this.prisma.$queryRaw`select monta_serie_variavel_calculada(${inputParams.variavel_id}::int);`,
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

        if (variavel.tipo == 'Calculada') {
            // recalcular indicadores que usam essa variável
            await this.variavelService.recalc_indicador_usando_variaveis([inputParams.variavel_id], this.prisma);
        }

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
