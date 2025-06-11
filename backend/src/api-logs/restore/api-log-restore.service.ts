import { Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { DuckDBProviderService } from 'src/common/duckdb/duckdb-provider.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskableService } from 'src/task/entities/task.entity';
import { CreateApiLogDayDto } from '../dto/create-api-log-day.dto';
import { tryDecodeJson } from '../utils/json-utils';

@Injectable()
export class ApiLogRestoreService implements TaskableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly duckDBProviderService: DuckDBProviderService
    ) {}

    async executeJob(params: CreateApiLogDayDto, task_id: string): Promise<any> {
        try {
            // Primeiro busca o registro de controle e valida o status
            const control = await this.prisma.apiRequestLogControl.findUnique({
                where: { log_date: params.date },
            });

            if (!control || control.status !== 'BACKED_UP' || !control.backup_location) {
                throw new Error('Backup não encontrado ou inválido para restauração.');
            }

            // Só atualiza para RESTORING se o status for válido
            await this.prisma.apiRequestLogControl.update({
                where: { log_date: params.date },
                data: {
                    status: 'RESTORING',
                    task_id: +task_id,
                },
            });
            const duckDB = await this.duckDBProviderService.getConfiguredInstance();

            const s3Path = control.backup_location;

            // Carregar os dados do Parquet para DuckDB
            await duckDB.run(`
                CREATE TABLE logs_to_restore AS
                SELECT * FROM read_parquet('${s3Path}');
            `);

            const rows = await duckDB.all('SELECT * FROM logs_to_restore');

            const logsToInsert = rows.map((row) => ({
                created_at: new Date(row.created_at),
                cf_ray: row.cf_ray,
                request_num: row.request_num,
                ip: row.ip,
                response_time: row.response_time,
                response_size: row.response_size,
                req_method: row.req_method,
                req_path: row.req_path,
                req_host: row.req_host,
                req_headers: JSON.stringify(tryDecodeJson(row.req_headers)),
                req_query: JSON.stringify(tryDecodeJson(row.req_query)),
                req_body: JSON.stringify(tryDecodeJson(row.req_body)),
                req_body_size: row.req_body_size ?? 0,
                res_code: row.res_code,
                created_pessoa_id: row.created_pessoa_id ?? null,
            }));

            await this.prisma.api_request_log.createMany({
                data: logsToInsert,
                skipDuplicates: true,
            });

            await this.prisma.apiRequestLogControl.update({
                where: { log_date: params.date },
                data: {
                    status: 'RESTORED',
                    last_error: null,
                },
            });

            await duckDB.close();

            return {
                date: params.date,
                status: 'success',
                recordsRestored: logsToInsert.length,
            };
        } catch (error) {
            await this.prisma.apiRequestLogControl.update({
                where: { log_date: params.date },
                data: {
                    status: 'FAILED_RESTORE',
                    last_error: error.message,
                },
            });

            if (task_id) {
                await this.prisma.task_queue.update({
                    where: { id: +task_id },
                    data: { status: 'errored' },
                });
            }

            return {
                date: params.date,
                status: 'failed',
                error: error.message,
            };
        }
    }

    async dropDay(dto: CreateApiLogDayDto): Promise<void> {
        const control = await this.prisma.apiRequestLogControl.findUnique({
            where: { log_date: dto.date },
        });

        if (!control || control.status !== 'RESTORED') {
            throw new NotFoundException('Nenhum log restaurado encontrado para o dia especificado.');
        }

        await this.prisma.$transaction([
            this.prisma.apiRequestLogControl.update({
                where: { log_date: dto.date },
                data: { status: 'BACKED_UP' },
            }),
            this.prisma.api_request_log.deleteMany({
                where: {
                    created_at: {
                        gte: DateTime.fromJSDate(dto.date, { zone: 'utc' }).startOf('day').toJSDate(),
                        lt: DateTime.fromJSDate(dto.date, { zone: 'utc' }).plus({ days: 1 }).startOf('day').toJSDate(),
                    },
                },
            }),
        ]);
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
