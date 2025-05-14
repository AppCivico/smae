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

        // Mantém a detecção de duplicatas exatas antes da transação
        await this.prisma.$queryRaw`
            UPDATE task_queue
            SET status='completed', output = '{"duplicated": true}'
            WHERE type = 'refresh_variavel'
            AND status='pending' AND id != ${task.id}
            AND (params->>'variavel_id')::int = ${inputParams.variavel_id}::int
            AND criado_em = (select criado_em from task_queue where id = ${task.id})
        `;

        const variavel = await this.prisma.variavel.findFirst({
            where: { id: inputParams.variavel_id },
            select: {
                id: true,
                tipo: true,
            },
        });
        if (!variavel) return { success: false, error: 'Variável não encontrada' };

        let intermediateError: Error | undefined = undefined;
        await RetryOperation(
            5,
            async () => {
                // Inicia uma transação para garantir atomicidade
                await this.prisma.$transaction(async (prismaTx) => {
                    // Executa a função de recálculo de série variável dentro da transação
                    await prismaTx.$queryRaw`select monta_serie_variavel_calculada(${inputParams.variavel_id}::int);`;

                    // Inclui as operações de pós-recálculo na mesma transação
                    if (variavel.tipo == 'Calculada') {
                        // recalcular indicadores que usam essa variável
                        await this.variavelService.recalc_indicador_usando_variaveis(
                            [inputParams.variavel_id],
                            prismaTx
                        );
                    }

                    // Se o recálculo for bem-sucedido, remove jobs antigos pendentes com o mesmo variavel_id
                    await prismaTx.$queryRaw`
                        DELETE FROM task_queue
                        WHERE type = 'refresh_variavel'
                        AND status='pending'
                        AND id != ${task.id}
                        AND (params->>'variavel_id')::int = ${inputParams.variavel_id}::int
                        AND criado_em < (SELECT criado_em FROM task_queue WHERE id = ${task.id})
                    `;

                    if (variavel.tipo == 'Global') {
                        // Sincroniza o dashboard de PS quando uma variável global é recalculada
                        try {
                            await this.variavelService.recalc_vars_ps_dashboard([inputParams.variavel_id], prismaTx);
                            this.logger.log(`Dashboard de PS atualizado para variável ${inputParams.variavel_id}`);
                        } catch (error) {
                            this.logger.error(`Erro ao atualizar dashboard de PS: ${error.message}`);
                            intermediateError = new Error(`Erro ao atualizar dashboard de PS: ${error.message}`);
                        }
                    }
                });
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

        // da rollback apenas na task, mas deixa a variável OK, já que essa parte do dash é menos crítica
        if (intermediateError) {
            throw intermediateError;
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
