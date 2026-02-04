import { Injectable, Logger } from '@nestjs/common';
import { Database } from 'duckdb-async';
import { SmaeConfigService } from '../services/smae-config.service';

export interface DuckDBConfig {
    /** Caminho do banco (:memory: para memória) */
    dbPath?: string;
    /** Limite de memória (ex: '2GB') */
    memoryLimit?: string;
    /** Número de threads */
    threads?: number;
    /** Extensões para instalar/carregar */
    extensions?: string[];
    /** Configurações S3 */
    s3Config?: {
        accessKey: string;
        secretKey: string;
        region: string;
        endpoint: string;
        useSsl?: boolean;
        urlStyle?: 'vhost' | 'path';
    };
}

@Injectable()
export class DuckDBProviderService {
    private readonly logger = new Logger(DuckDBProviderService.name);

    constructor(private readonly smaeConfigService: SmaeConfigService) {}

    /**
     * Cria uma instância configurada do DuckDB com suporte a S3
     */
    async getConfiguredInstance(): Promise<Database> {
        const config = await this.buildConfigFromSmaeConfig();
        return this.createInstance(config);
    }

    /**
     * Cria uma instância do DuckDB com configurações específicas
     */
    async createInstance(config: DuckDBConfig = {}): Promise<Database> {
        const dbPath = config.dbPath ?? ':memory:';
        const memoryLimit = config.memoryLimit ?? '2GB';
        const threads = config.threads ?? 2;
        const extensions = config.extensions ?? ['httpfs', 'vss', 'fts', 'postgres'];

        this.logger.log(`Criando instância DuckDB (${dbPath})...`);

        const duckdb = await Database.create(dbPath);

        // Configurações de performance
        await duckdb.run(`SET memory_limit = '${memoryLimit}'`);
        await duckdb.run(`SET threads = ${threads}`);

        // Instala e carrega extensões
        for (const ext of extensions) {
            try {
                await duckdb.run(`INSTALL ${ext};`);
                await duckdb.run(`LOAD ${ext};`);
                this.logger.debug(`Extensão ${ext} carregada`);
            } catch (e) {
                this.logger.warn(`Falha ao carregar extensão ${ext}: ${e}`);
            }
        }

        // Configura S3 se fornecido
        if (config.s3Config) {
            await this.configureS3(duckdb, config.s3Config);
        }

        this.logger.log('Instância DuckDB criada com sucesso');
        return duckdb;
    }

    /**
     * Cria uma instância otimizada para vector similarity search
     */
    async createVectorSearchInstance(
        vectorDimension: number,
        estimatedRows: number = 100000
    ): Promise<Database> {
        // Estima memória necessária: ~2GB base + ~1KB por vetor para HNSW index
        const estimatedMemoryMB = 2048 + Math.ceil((estimatedRows * 1) / 1024);
        const memoryLimit = `${Math.min(estimatedMemoryMB, 8192)}MB`; // Max 8GB

        const config: DuckDBConfig = {
            dbPath: ':memory:',
            memoryLimit,
            threads: 4,
            extensions: ['vss', 'fts', 'postgres'],
        };

        const db = await this.createInstance(config);

        // Habilita persistência experimental do índice HNSW se necessário
        await db.run('SET hnsw_enable_experimental_persistence = true');

        return db;
    }

    /**
     * Anexa um banco PostgreSQL à instância DuckDB
     */
    async attachPostgres(
        db: Database,
        connectionString: string,
        alias: string = 'postgres'
    ): Promise<void> {
        this.logger.log(`Anexando PostgreSQL como ${alias}...`);
        await db.run(`ATTACH '${connectionString}' AS ${alias} (TYPE postgres)`);
        this.logger.log(`PostgreSQL anexado com sucesso como ${alias}`);
    }

    /**
     * Cria um índice HNSW para vector similarity search
     */
    async createHNSWIndex(
        db: Database,
        tableName: string,
        columnName: string,
        metric: 'l2sq' | 'cosine' | 'ip' = 'cosine',
        options: {
            ef_construction?: number;
            ef_search?: number;
            M?: number;
        } = {}
    ): Promise<void> {
        const efConstruction = options.ef_construction ?? 128;
        const efSearch = options.ef_search ?? 64;
        const M = options.M ?? 16;

        this.logger.log(`Criando índice HNSW em ${tableName}.${columnName} (metric: ${metric})...`);

        const indexName = `idx_${tableName}_${columnName}_hnsw`;

        await db.run(`
            CREATE INDEX IF NOT EXISTS ${indexName}
            ON ${tableName}
            USING HNSW (${columnName})
            WITH (
                metric = '${metric}',
                ef_construction = ${efConstruction},
                ef_search = ${efSearch},
                M = ${M}
            )
        `);

        this.logger.log(`Índice HNSW ${indexName} criado com sucesso`);
    }

    /**
     * Cria um índice FTS (Full-Text Search) com BM25
     */
    async createFTSIndex(
        db: Database,
        tableName: string,
        idColumn: string,
        ...textColumns: string[]
    ): Promise<void> {
        this.logger.log(`Criando índice FTS em ${tableName} (${textColumns.join(', ')})...`);

        const columnsStr = textColumns.map((c) => `'${c}'`).join(', ');

        await db.run(`
            PRAGMA create_fts_index(
                '${tableName}',
                '${idColumn}',
                ${columnsStr},
                stemmer = 'portuguese',
                stopwords = 'portuguese'
            )
        `);

        this.logger.log(`Índice FTS criado com sucesso`);
    }

    private async configureS3(
        db: Database,
        config: NonNullable<DuckDBConfig['s3Config']>
    ): Promise<void> {
        const endpoint = config.endpoint.replace(/^https?:\/\//, '');
        const useSsl = config.useSsl ?? config.endpoint.startsWith('https');
        const urlStyle = config.urlStyle ?? 'vhost';

        await db.run(`
            CREATE OR REPLACE SECRET smaep_s3_secret (
                TYPE S3,
                PROVIDER CONFIG,
                KEY_ID '${config.accessKey}',
                SECRET '${config.secretKey}',
                REGION '${config.region}',
                ENDPOINT '${endpoint}',
                USE_SSL ${useSsl ? 'TRUE' : 'FALSE'},
                URL_STYLE '${urlStyle}'
            )
        `);

        this.logger.log('Configuração S3 aplicada');
    }

    private async buildConfigFromSmaeConfig(): Promise<DuckDBConfig> {
        const accessKey = await this.smaeConfigService.getConfig('S3_ACCESS_KEY');
        const secretKey = await this.smaeConfigService.getConfig('S3_SECRET_KEY');
        const region = (await this.smaeConfigService.getConfig('S3_REGION')) ?? 'us-east-1';
        let endpoint = await this.smaeConfigService.getConfig('S3_HOST') ?? '';
        const urlStyle = (await this.smaeConfigService.getConfig('S3_URL_STYLE')) ?? 'vhost';

        if (endpoint.startsWith('http')) {
            endpoint = endpoint.replace(/^https?:\/\//, '');
        }

        const config: DuckDBConfig = {
            dbPath: ':memory:',
            memoryLimit: '2GB',
            threads: 2,
            extensions: ['httpfs', 'vss', 'fts', 'postgres'],
        };

        if (accessKey && secretKey) {
            config.s3Config = {
                accessKey,
                secretKey,
                region,
                endpoint,
                urlStyle: urlStyle as 'vhost' | 'path',
                useSsl: endpoint.startsWith('https'),
            };
        }

        return config;
    }
}
