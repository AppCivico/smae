import { Injectable } from '@nestjs/common';
import { TaskableService } from 'src/task/entities/task.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { DuckDBProviderService } from 'src/common/duckdb/duckdb-provider.service';
import { tryDecodeJson } from '../utils/json-utils';

@Injectable()
export class ApiLogRestoreService implements TaskableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly smaeConfigService: SmaeConfigService,
        private readonly duckDBProviderService: DuckDBProviderService
    ) {}

    async executeJob(payload: { date: string; task_id?: number }): Promise<any> {
        const { date, task_id } = payload;
        const logDateUTC = new Date(`${date}T00:00:00Z`);

        try {
            await this.prisma.apiRequestLogControl.update({
                where: { log_date: logDateUTC },
                data: {
                    status: 'RESTORING',
                    task_id: task_id ?? null,
                },
            });
            const duckDB = await this.duckDBProviderService.getConfiguredInstance();

            const control = await this.prisma.apiRequestLogControl.findUnique({
                where: { log_date: logDateUTC },
            });

            if (!control || control.status !== 'BACKED_UP' || !control.backup_location) {
                throw new Error('Backup não encontrado ou inválido para restauração.');
            }

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
                where: { log_date: logDateUTC },
                data: {
                    status: 'RESTORED',
                    last_error: null,
                },
            });

            await duckDB.close();

            return {
                date,
                status: 'success',
                recordsRestored: logsToInsert.length,
            };
        } catch (error) {
            await this.prisma.apiRequestLogControl.update({
                where: { log_date: logDateUTC },
                data: {
                    status: 'FAILED_RESTORE',
                    last_error: error.message,
                },
            });

            if (task_id) {
                await this.prisma.task_queue.update({
                    where: { id: task_id },
                    data: { status: 'errored' },
                });
            }

            return {
                date,
                status: 'failed',
                error: error.message,
            };
        }
    }

    outputToJson(): any {
        return {};
    }
}
