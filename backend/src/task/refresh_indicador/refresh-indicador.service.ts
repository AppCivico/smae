import { Injectable, Logger } from '@nestjs/common';
import { RetryOperation } from '../../common/RetryOperation';
import { RetryPromise } from '../../common/retryPromise';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshIndicadorDto } from './dto/create-refresh-indicador.dto';

@Injectable()
export class RefreshIndicadorService implements TaskableService {
    private readonly logger = new Logger(RefreshIndicadorService.name);
    constructor(private readonly prisma: PrismaService) {}

    async executeJob(inputParams: CreateRefreshIndicadorDto, _taskId: string): Promise<any> {
        const before = Date.now();

        this.logger.verbose(
            `Refreshing indicador ${inputParams.indicador_id}, other info: ${JSON.stringify(inputParams)}...`
        );

        await RetryOperation(
            5,
            async () => {
                await RetryPromise(
                    () =>
                        this.prisma
                            .$queryRaw`select monta_serie_indicador(${inputParams.indicador_id}::int, null, null, null);`,
                    10,
                    100,
                    20
                );
            },
            async (error) => {
                await this.prisma.indicador.update({
                    where: { id: inputParams.indicador_id },
                    data: {
                        recalculando: true,
                        recalculo_erro: `Erro ao recalcular indicador: ${error.message}`,
                    },
                });

                throw error;
            }
        );

        const took = Date.now() - before;
        await this.prisma.indicador.update({
            where: { id: inputParams.indicador_id },
            data: {
                recalculo_erro: null,
                recalculo_tempo: took / 1000,
            },
        });

        return {
            success: true,
            took,
        };
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
