import { Injectable } from '@nestjs/common';
import { Database } from 'duckdb-async';
import { SmaeConfigService } from '../services/smae-config.service';

@Injectable()
export class DuckDBProviderService {
    constructor(private readonly smaeConfigService: SmaeConfigService) {}

    async getConfiguredInstance(): Promise<Database> {
        const accessKey = await this.smaeConfigService.getConfig('S3_ACCESS_KEY');
        const secretKey = await this.smaeConfigService.getConfig('S3_SECRET_KEY');
        const region = (await this.smaeConfigService.getConfig('S3_REGION')) ?? 'us-east-1';
        const endpoint = await this.smaeConfigService.getConfig('S3_HOST');
        const urlStyle = (await this.smaeConfigService.getConfig('S3_URL_STYLE')) ?? 'vhost';

        const duckDB = await Database.create(':memory:');
        await duckDB.run('INSTALL httpfs;');
        await duckDB.run('LOAD httpfs;');
        await duckDB.run(`
            CREATE OR REPLACE SECRET api_log_backup_s3_secret (
                TYPE S3,
                PROVIDER CONFIG,
                KEY_ID '${accessKey}',
                SECRET '${secretKey}',
                REGION '${region}',
                ENDPOINT '${endpoint}',
                USE_SSL ${endpoint?.startsWith('https') ? 'TRUE' : 'FALSE'},
                URL_STYLE '${urlStyle}'
            );
        `);
        return duckDB;
    }
}
