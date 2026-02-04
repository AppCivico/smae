import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DuckDBSidecarService } from './duckdb-sidecar.service';
import { ConfigService } from '@nestjs/config';

export interface VectorSearchResult {
    id: string | number;
    score: number;
    metadata?: Record<string, any>;
}

export interface BM25SearchResult {
    id: string | number;
    score: number;
    content?: string;
}

export interface HybridSearchResult {
    id: string | number;
    semanticScore: number;
    lexicalScore: number;
    combinedScore: number;
    metadata?: Record<string, any>;
}

/**
 * Serviço de busca usando DuckDB para Vector Similarity (CLIP/embeddings) e BM25.
 *
 * Este serviço utiliza o sidecar DuckDB para executar buscas eficientes:
 * - Busca vetorial usando HNSW index (cosine similarity)
 * - Busca textual usando BM25 (FTS extension)
 * - Busca híbrida combinando ambas
 *
 * @example
 * // Busca por similaridade de embeddings
 * const results = await searchService.vectorSearch(
 *   'documentos',
 *   queryEmbedding,  // float[] from CLIP or other model
 *   10
 * );
 *
 * @example
 * // Busca BM25
 * const results = await searchService.bm25Search(
 *   'documentos',
 *   'termos de busca',
 *   10
 * );
 *
 * @example
 * // Busca híbrida
 * const results = await searchService.hybridSearch(
 *   'documentos',
 *   queryEmbedding,
 *   'termos de busca',
 *   { vectorWeight: 0.7, bm25Weight: 0.3 },
 *   10
 * );
 */
@Injectable()
export class DuckDBSearchService implements OnModuleInit {
    private readonly logger = new Logger(DuckDBSearchService.name);
    private postgresAttached = false;

    constructor(
        private readonly sidecar: DuckDBSidecarService,
        private readonly configService: ConfigService
    ) {}

    async onModuleInit() {
        // Anexa PostgreSQL ao iniciar
        if (this.sidecar.isSidecarReady()) {
            await this.attachPostgres();
        }
    }

    /**
     * Sincroniza dados do PostgreSQL para o DuckDB.
     * Carrega embeddings e conteúdo textual para memória.
     */
    async syncTable(
        tableName: string,
        options: {
            columns?: string[];
            where?: string;
            limit?: number;
            embeddingColumn?: string;
            textColumns?: string[];
            idColumn?: string;
        } = {}
    ): Promise<boolean> {
        if (!this.sidecar.isSidecarReady()) {
            this.logger.error('Sidecar não está pronto');
            return false;
        }

        // Garante que PostgreSQL está anexado
        if (!this.postgresAttached) {
            const attached = await this.attachPostgres();
            if (!attached) return false;
        }

        const columns = options.columns || ['*'];
        const result = await this.sidecar.syncFromPostgres(tableName, {
            columns,
            where: options.where,
            limit: options.limit,
            duckdbTableName: tableName,
        });

        if (!result.success) {
            this.logger.error(`Falha ao sincronizar tabela ${tableName}: ${result.error}`);
            return false;
        }

        this.logger.log(`Tabela ${tableName} sincronizada com sucesso (${result.data.length} linhas)`);

        // Cria índices se especificado
        if (options.embeddingColumn) {
            await this.createVectorIndex(tableName, options.embeddingColumn);
        }

        if (options.textColumns && options.textColumns.length > 0 && options.idColumn) {
            await this.createBM25Index(tableName, options.idColumn, options.textColumns);
        }

        return true;
    }

    /**
     * Cria índice HNSW para busca vetorial
     */
    async createVectorIndex(
        tableName: string,
        columnName: string,
        metric: 'l2sq' | 'cosine' | 'ip' = 'cosine'
    ): Promise<boolean> {
        const sql = `
            CREATE INDEX IF NOT EXISTS idx_${tableName}_${columnName}_hnsw 
            ON ${tableName} USING HNSW (${columnName}) 
            WITH (metric = '${metric}')
        `;

        const result = await this.sidecar.query(sql);

        if (!result.success) {
            this.logger.error(`Falha ao criar índice vetorial: ${result.error}`);
            return false;
        }

        this.logger.log(`Índice vetorial criado em ${tableName}.${columnName}`);
        return true;
    }

    /**
     * Cria índice FTS para busca BM25
     */
    async createBM25Index(
        tableName: string,
        idColumn: string,
        textColumns: string[]
    ): Promise<boolean> {
        const columnsStr = textColumns.map((c) => `'${c}'`).join(', ');
        const sql = `
            PRAGMA create_fts_index(
                '${tableName}',
                '${idColumn}',
                ${columnsStr},
                stemmer = 'portuguese',
                stopwords = 'portuguese'
            )
        `;

        const result = await this.sidecar.query(sql);

        if (!result.success) {
            this.logger.error(`Falha ao criar índice BM25: ${result.error}`);
            return false;
        }

        this.logger.log(`Índice BM25 criado em ${tableName} (${textColumns.join(', ')})`);
        return true;
    }

    /**
     * Busca por similaridade vetorial (CLIP/embeddings)
     */
    async vectorSearch(
        tableName: string,
        queryVector: number[],
        topK: number = 10,
        options: {
            embeddingColumn?: string;
            idColumn?: string;
            metric?: 'cosine' | 'l2sq' | 'ip';
            additionalColumns?: string[];
            where?: string;
        } = {}
    ): Promise<VectorSearchResult[]> {
        const embeddingCol = options.embeddingColumn || 'embedding';
        const idCol = options.idColumn || 'id';
        const metric = options.metric || 'cosine';
        const additionalCols = options.additionalColumns || [];
        const whereClause = options.where ? `WHERE ${options.where}` : '';

        // Função de distância baseada na métrica
        let distanceFunc: string;
        let orderDirection: 'ASC' | 'DESC';

        switch (metric) {
            case 'cosine':
                distanceFunc = 'array_cosine_similarity';
                orderDirection = 'DESC'; // Maior = mais similar
                break;
            case 'l2sq':
                distanceFunc = 'array_distance';
                orderDirection = 'ASC'; // Menor = mais similar
                break;
            case 'ip':
                distanceFunc = 'array_inner_product';
                orderDirection = 'DESC'; // Maior = mais similar
                break;
            default:
                distanceFunc = 'array_cosine_similarity';
                orderDirection = 'DESC';
        }

        const vectorStr = queryVector.map((v) => v.toString()).join(', ');
        const extraCols = additionalCols.length > 0 ? ', ' + additionalCols.join(', ') : '';

        const sql = `
            SELECT 
                ${idCol} as id,
                ${distanceFunc}(${embeddingCol}, [${vectorStr}]::FLOAT[${queryVector.length}]) as score
                ${extraCols}
            FROM ${tableName}
            ${whereClause}
            ORDER BY score ${orderDirection}
            LIMIT ${topK}
        `;

        const result = await this.sidecar.query(sql);

        if (!result.success) {
            this.logger.error(`Erro na busca vetorial: ${result.error}`);
            return [];
        }

        return result.data.map((row: any) => ({
            id: row.id,
            score: row.score,
            metadata: additionalCols.reduce((acc, col) => {
                if (col in row) acc[col] = row[col];
                return acc;
            }, {} as Record<string, any>),
        }));
    }

    /**
     * Busca textual usando BM25
     */
    async bm25Search(
        tableName: string,
        queryText: string,
        topK: number = 10,
        options: {
            idColumn?: string;
            fields?: string[];
            additionalColumns?: string[];
            conjunctive?: boolean;
        } = {}
    ): Promise<BM25SearchResult[]> {
        const idCol = options.idColumn || 'id';
        const fields = options.fields;
        const additionalCols = options.additionalColumns || [];
        const conjunctive = options.conjunctive ?? false;

        const extraCols = additionalCols.length > 0 ? ', ' + additionalCols.join(', ') : '';

        // Escapa a query para evitar SQL injection
        const escapedQuery = queryText.replace(/'/g, "''");
        const fieldsParam = fields ? `fields := '${fields.join(', ')}'` : 'fields := NULL';

        const sql = `
            SELECT 
                ${idCol} as id,
                fts_main_${tableName}.match_bm25(
                    ${idCol},
                    '${escapedQuery}',
                    ${fieldsParam},
                    conjunctive := ${conjunctive ? 1 : 0}
                ) as score
                ${extraCols}
            FROM ${tableName}
            WHERE score IS NOT NULL
            ORDER BY score DESC
            LIMIT ${topK}
        `;

        const result = await this.sidecar.query(sql);

        if (!result.success) {
            this.logger.error(`Erro na busca BM25: ${result.error}`);
            return [];
        }

        return result.data.map((row: any) => ({
            id: row.id,
            score: row.score,
            content: additionalCols.length > 0 ? row[additionalCols[0]] : undefined,
        }));
    }

    /**
     * Busca híbrida combinando vector search + BM25
     */
    async hybridSearch(
        tableName: string,
        queryVector: number[],
        queryText: string,
        topK: number = 10,
        options: {
            weights?: { vector: number; bm25: number };
            embeddingColumn?: string;
            idColumn?: string;
            textFields?: string[];
        } = {}
    ): Promise<HybridSearchResult[]> {
        const weights = options.weights || { vector: 0.7, bm25: 0.3 };
        const embeddingCol = options.embeddingColumn || 'embedding';
        const idCol = options.idColumn || 'id';

        // Busca semântica (vetorial)
        const vectorResults = await this.vectorSearch(tableName, queryVector, topK * 2, {
            embeddingColumn: embeddingCol,
            idColumn: idCol,
            metric: 'cosine',
        });

        // Busca lexical (BM25)
        const bm25Results = await this.bm25Search(tableName, queryText, topK * 2, {
            idColumn: idCol,
            fields: options.textFields,
        });

        // Combina resultados usando RRF (Reciprocal Rank Fusion)
        const k = 60; // Constante do RRF
        const scores = new Map<string | number, { semantic: number; lexical: number }>();

        // Adiciona scores semânticos (normalizados)
        const maxVectorScore = Math.max(...vectorResults.map((r) => r.score), 1);
        vectorResults.forEach((r, idx) => {
            const existing = scores.get(r.id) || { semantic: 0, lexical: 0 };
            existing.semantic = (r.score / maxVectorScore) * (1 / (k + idx + 1));
            scores.set(r.id, existing);
        });

        // Adiciona scores BM25
        bm25Results.forEach((r, idx) => {
            const existing = scores.get(r.id) || { semantic: 0, lexical: 0 };
            existing.lexical = 1 / (k + idx + 1); // BM25 já é ranqueado
            scores.set(r.id, existing);
        });

        // Calcula score combinado
        const combined: HybridSearchResult[] = Array.from(scores.entries())
            .map(([id, score]) => ({
                id,
                semanticScore: score.semantic,
                lexicalScore: score.lexical,
                combinedScore: score.semantic * weights.vector + score.lexical * weights.bm25,
            }))
            .sort((a, b) => b.combinedScore - a.combinedScore)
            .slice(0, topK);

        return combined;
    }

    /**
     * Executa uma query SQL arbitrária no sidecar
     */
    async executeQuery(sql: string, params?: any[]): Promise<any[] | null> {
        const result = await this.sidecar.query(sql, params);
        return result.success ? result.data : null;
    }

    private async attachPostgres(): Promise<boolean> {
        const connectionString = this.configService.get<string>('DATABASE_URL');
        if (!connectionString) {
            this.logger.error('DATABASE_URL não configurada');
            return false;
        }

        const attached = await this.sidecar.attachPostgres(connectionString, 'postgres');
        this.postgresAttached = attached;
        return attached;
    }
}
