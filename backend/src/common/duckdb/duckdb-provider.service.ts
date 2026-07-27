import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import { Injectable } from '@nestjs/common';
import { SmaeConfigService } from '../services/smae-config.service';

/**
 * Conexão pronta para uso, junto do `close()` que a encerra.
 *
 * `instance` é devolvido junto de propósito: a `DuckDBConnection` do `@duckdb/node-api` não
 * guarda referência para a instância que a criou, então expor só a conexão deixaria a
 * instância inalcançável enquanto a conexão ainda está em uso.
 */
export type ConfiguredDuckDB = {
    readonly con: DuckDBConnection;
    readonly instance: DuckDBInstance;
    close(): void;
};

@Injectable()
export class DuckDBProviderService {
    constructor(private readonly smaeConfigService: SmaeConfigService) {}

    async getConfiguredInstance(): Promise<ConfiguredDuckDB> {
        const accessKey = await this.smaeConfigService.getConfig('S3_ACCESS_KEY');
        const secretKey = await this.smaeConfigService.getConfig('S3_SECRET_KEY');
        const region = (await this.smaeConfigService.getConfig('S3_REGION')) ?? 'us-east-1';
        let endpoint = await this.smaeConfigService.getConfig('S3_HOST');
        const urlStyle = (await this.smaeConfigService.getConfig('S3_URL_STYLE')) ?? 'vhost';
        if (endpoint?.startsWith('http')) {
            // If the endpoint starts with http, we assume it's a full URL them must remove the protocol
            endpoint = endpoint.replace(/^https?:\/\//, '');
        }

        const instance = await DuckDBInstance.create(':memory:', { threads: '1', memory_limit: '800MB' });
        const con = await instance.connect();

        await con.run('INSTALL httpfs;');
        await con.run('LOAD httpfs;');
        await con.run(`
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

        return {
            con,
            instance,
            close: () => con.disconnectSync(),
        };
    }
}
