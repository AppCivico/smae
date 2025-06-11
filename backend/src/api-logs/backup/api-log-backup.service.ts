import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CHUNK_SIZE } from 'src/common/consts';
import { DuckDBProviderService } from 'src/common/duckdb/duckdb-provider.service';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskableService } from 'src/task/entities/task.entity';
import { CreateApiLogDayDto } from '../dto/create-api-log-day.dto';
import { tryDecodeJson } from '../utils/json-utils';
import { Date2YMD } from '../../common/date2ymd';

@Injectable()
export class ApiLogBackupService implements TaskableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly smaeConfigService: SmaeConfigService,
        private readonly duckDBProviderService: DuckDBProviderService
    ) {}

    async executeJob(payload: CreateApiLogDayDto, task_id: string): Promise<any> {
        const logDateUTC = payload.date;

        let totalRecords = 0;
        const duckDB = await this.duckDBProviderService.getConfiguredInstance();

        try {
            await this.prisma.apiRequestLogControl.update({
                where: { log_date: logDateUTC },
                data: {
                    status: 'BACKING_UP',
                    task_id: +task_id,
                    last_error: null,
                },
            });

            const bucket = await this.smaeConfigService.getConfig('S3_BUCKET');
            const fileName = `api_log_${Date2YMD.toString(payload.date)}.parquet`;
            const s3Path = `s3://${bucket}/api_request_logs/${fileName}`;

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
                            gte: DateTime.fromJSDate(logDateUTC, { zone: 'utc' }).startOf('day').toJSDate(),
                            lt: DateTime.fromJSDate(logDateUTC, { zone: 'utc' })
                                .plus({ days: 1 })
                                .startOf('day')
                                .toJSDate(),
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

                const batchData = logs.map((log) => [
                    log.created_at.toISOString(),
                    log.cf_ray,
                    log.request_num,
                    log.ip,
                    log.response_time,
                    log.response_size,
                    log.req_method,
                    log.req_path,
                    log.req_host,
                    JSON.stringify(tryDecodeJson(log.req_headers)),
                    JSON.stringify(tryDecodeJson(log.req_query)),
                    JSON.stringify(tryDecodeJson(log.req_body)),
                    log.req_body_size ?? 0,
                    log.res_code,
                    log.created_pessoa_id ?? null,
                ]);

                const placeholders = batchData.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
                const flatData = batchData.flat();
                await duckDB.run(`INSERT INTO logs_for_backup VALUES ${placeholders}`, ...flatData);

                totalRecords += logs.length;
                offset += CHUNK_SIZE;
            }

            if (totalRecords === 0) {
                return { status: 'no_data', date: payload.date };
            }

            await duckDB.run(`COPY logs_for_backup TO '${s3Path}' (FORMAT PARQUET, COMPRESSION 'ZSTD');`);

            await this.prisma.$transaction(async (tx) => {
                await tx.api_request_log.deleteMany({
                    where: {
                        created_at: {
                            gte: DateTime.fromJSDate(logDateUTC, { zone: 'utc' }).startOf('day').toJSDate(),
                            lt: DateTime.fromJSDate(logDateUTC, { zone: 'utc' })
                                .plus({ days: 1 })
                                .startOf('day')
                                .toJSDate(),
                        },
                    },
                });

                await tx.apiRequestLogControl.update({
                    where: { log_date: logDateUTC },
                    data: {
                        status: 'BACKED_UP',
                        backup_location: s3Path,
                        last_error: null,
                    },
                });
            });

            await duckDB.close();

            return {
                date: payload.date,
                status: 'success',
                parquetFileS3Path: s3Path,
                recordsBackedUp: totalRecords,
            };
        } catch (error) {
            await duckDB.close();
            await this.prisma.apiRequestLogControl.update({
                where: { log_date: logDateUTC },
                data: {
                    status: 'FAILED_BACKUP',
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
                status: 'failed',
                date: payload.date,
                error: error.message,
            };
        }
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
