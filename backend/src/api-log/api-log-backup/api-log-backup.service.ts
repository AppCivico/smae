import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { TaskableService } from 'src/task/entities/task.entity';
import { DuckDBProviderService } from 'src/common/duckdb/duckdb-provider.service';
import { CHUNK_SIZE } from 'src/common/consts';
import { tryDecodeJson } from '../utils/json-utils';

@Injectable()
export class ApiLogBackupService implements TaskableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly smaeConfigService: SmaeConfigService,
        private readonly duckDBProviderService: DuckDBProviderService
    ) {}

    async executeJob(payload: { date: string; task_id?: number }): Promise<any> {
        const { date, task_id } = payload;
        const logDateUTC = new Date(`${date}T00:00:00Z`);
        let totalRecords = 0;

        try {
            await this.prisma.apiRequestLogControl.update({
                where: { log_date: logDateUTC },
                data: {
                    status: 'BACKING_UP',
                    task_id: task_id ?? null,
                    last_error: null,
                },
            });

            const bucket = await this.smaeConfigService.getConfig('S3_BUCKET');
            const fileName = `api_log_${date}.parquet`;
            const s3Path = `s3://${bucket}/api_request_logs/${fileName}`;

            const duckDB = await this.duckDBProviderService.getConfiguredInstance();

            await duckDB.run(`
                CREATE TABLE logs_for_backup (
                    created_at TIMESTAMP,
                    cf_ray VARCHAR,
                    request_num INT,
                    ip VARCHAR,
                    response_time INT,
                    response_size INT,
                    req_method VARCHAR,
                    req_path VARCHAR,
                    req_host VARCHAR,
                    req_headers VARCHAR,
                    req_query VARCHAR,
                    req_body VARCHAR,
                    req_body_size INT,
                    res_code INT,
                    created_pessoa_id INT
                );
            `);

            let offset = 0;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const logs = await this.prisma.api_request_log.findMany({
                    skip: offset,
                    take: CHUNK_SIZE,
                    where: {
                        created_at: {
                            gte: new Date(`${date}T00:00:00.000Z`),
                            lt: new Date(`${date}T23:59:59.999Z`),
                        },
                    },
                    select: {
                        created_at: true,
                        cf_ray: true,
                        request_num: true,
                        ip: true,
                        response_time: true,
                        response_size: true,
                        req_method: true,
                        req_path: true,
                        req_host: true,
                        req_headers: true,
                        req_query: true,
                        req_body: true,
                        req_body_size: true,
                        res_code: true,
                        created_pessoa_id: true,
                    },
                });

                if (logs.length === 0) break;

                for (const log of logs) {
                    const row = {
                        created_at: log.created_at.toISOString(),
                        cf_ray: log.cf_ray,
                        request_num: log.request_num,
                        ip: log.ip,
                        response_time: log.response_time,
                        response_size: log.response_size,
                        req_method: log.req_method,
                        req_path: log.req_path,
                        req_host: log.req_host,
                        req_headers: JSON.stringify(tryDecodeJson(log.req_headers)),
                        req_query: JSON.stringify(tryDecodeJson(log.req_query)),
                        req_body: JSON.stringify(tryDecodeJson(log.req_body)),
                        req_body_size: log.req_body_size ?? 0,
                        res_code: log.res_code,
                        created_pessoa_id: log.created_pessoa_id ?? null,
                    };

                    const values = [
                        `'${row.created_at}'`,
                        `'${row.cf_ray}'`,
                        row.request_num,
                        `'${row.ip}'`,
                        row.response_time,
                        row.response_size,
                        `'${row.req_method}'`,
                        `'${row.req_path}'`,
                        `'${row.req_host}'`,
                        `'${row.req_headers}'`,
                        `'${row.req_query}'`,
                        `'${row.req_body}'`,
                        row.req_body_size,
                        row.res_code,
                        row.created_pessoa_id ?? 'NULL',
                    ].join(', ');

                    await duckDB.run(`INSERT INTO logs_for_backup VALUES (${values});`);
                }

                totalRecords += logs.length;
                offset += CHUNK_SIZE;
            }

            if (totalRecords === 0) {
                return { status: 'no_data', date };
            }

            await duckDB.run(`COPY logs_for_backup TO '${s3Path}' (FORMAT PARQUET, COMPRESSION 'ZSTD');`);

            await this.prisma.api_request_log.deleteMany({
                where: {
                    created_at: {
                        gte: new Date(`${date}T00:00:00.000Z`),
                        lt: new Date(`${date}T23:59:59.999Z`),
                    },
                },
            });

            await this.prisma.apiRequestLogControl.update({
                where: { log_date: logDateUTC },
                data: {
                    status: 'BACKED_UP',
                    backup_location: s3Path,
                    last_error: null,
                },
            });

            await duckDB.close();

            return {
                date,
                status: 'success',
                parquetFileS3Path: s3Path,
                recordsBackedUp: totalRecords,
            };
        } catch (error) {
            await this.prisma.apiRequestLogControl.update({
                where: { log_date: logDateUTC },
                data: {
                    status: 'FAILED_BACKUP',
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
                status: 'failed',
                date,
                error: error.message,
            };
        }
    }

    outputToJson(): any {
        return {};
    }
}
