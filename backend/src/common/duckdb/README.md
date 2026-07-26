# DuckDB Sidecar Module

Módulo NestJS para executar DuckDB em um processo separado (sidecar), com suporte a:
- **Vector Similarity Search** (HNSW index) - para busca semântica com embeddings CLIP
- **Full-Text Search** (BM25) - para busca textual
- **Hybrid Search** - combinação de ambas as abordagens
- **PostgreSQL integration** - attach direto ao banco Postgres

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    Main NestJS Process                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ DuckDBSidecarSvc │  │ DuckDBSearchSvc  │  │ Other Svcs   │  │
│  │  (monitora e     │  │  (API de busca)  │  │              │  │
│  │   controla)      │  │                  │  │              │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────┘  │
│           │                     │                               │
│           │ IPC (fork)          │ Usa                           │
│           ▼                     ▼                               │
│  ┌──────────────────────────────────────────────┐              │
│  │         DuckDB Sidecar Process               │              │
│  │  ┌──────────────────────────────────────┐   │              │
│  │  │  DuckDB (:memory:)                   │   │              │
│  │  │  - VSS extension (HNSW index)        │   │              │
│  │  │  - FTS extension (BM25)              │   │              │
│  │  │  - Postgres extension                │   │              │
│  │  └──────────────────────────────────────┘   │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ATTACH
                              ▼
                     ┌─────────────────┐
                     │   PostgreSQL    │
                     │   (dados)       │
                     └─────────────────┘
```

## Features

### 1. Processo Sidecar Isolado
- DuckDB roda em processo separado via `child_process.fork()`
- Comunicação via IPC (mensagens)
- Auto-restart em caso de falha (máx 1x por minuto)
- Health check periódico (ping/pong)

### 2. Vector Similarity Search
- HNSW index para busca aproximada em alta velocidade
- Suporta métricas: `cosine`, `l2sq` (euclidiana), `ip` (inner product)
- Ideal para embeddings CLIP, sentence-transformers, etc.

### 3. Full-Text Search (BM25)
- Índice FTS similar ao SQLite FTS5
- Stemming em português
- Ranking BM25 configurável

### 4. Hybrid Search
- Combina resultados de vector + BM25
- Usa RRF (Reciprocal Rank Fusion)
- Pesos configuráveis

## Instalação

O módulo já está incluído em `AppModule`. Para usar em outros módulos:

```typescript
import { DuckDBModule } from './common/duckdb';

@Module({
    imports: [DuckDBModule],
    providers: [YourService],
})
export class YourModule {}
```

## Uso

### Básico - Executar Queries

```typescript
import { DuckDBSidecarService } from './common/duckdb';

@Injectable()
export class MyService {
    constructor(private readonly duckdb: DuckDBSidecarService) {}

    async doSomething() {
        // Anexa PostgreSQL
        await this.duckdb.attachPostgres();

        // Sincroniza dados
        await this.duckdb.syncFromPostgres('minha_tabela', {
            columns: ['id', 'embedding', 'conteudo'],
            limit: 10000,
        });

        // Executa query
        const result = await this.duckdb.query(
            'SELECT * FROM minha_tabela WHERE id > ?',
            [100]
        );

        if (result.success) {
            console.log(result.data);
        }
    }
}
```

### Busca Vetorial (CLIP/Embeddings)

```typescript
import { DuckDBSearchService } from './common/duckdb';

@Injectable()
export class ImageSearchService {
    constructor(private readonly search: DuckDBSearchService) {}

    async searchSimilarImages(clipEmbedding: number[], topK = 10) {
        // Sincroniza tabela com embeddings (se necessário)
        await this.search.syncTable('imagens', {
            columns: ['id', 'embedding', 'filename'],
            embeddingColumn: 'embedding',
        });

        // Busca por similaridade
        const results = await this.search.vectorSearch('imagens', clipEmbedding, topK, {
            embeddingColumn: 'embedding',
            idColumn: 'id',
            metric: 'cosine', // CLIP usa cosine similarity
            additionalColumns: ['filename'],
        });

        return results.map((r) => ({
            id: r.id,
            score: r.score,
            filename: r.metadata?.filename,
        }));
    }
}
```

### Busca BM25 (Texto)

```typescript
async searchDocuments(query: string, topK = 10) {
    // Sincroniza com índice FTS
    await this.search.syncTable('documentos', {
        columns: ['id', 'titulo', 'conteudo'],
        idColumn: 'id',
        textColumns: ['titulo', 'conteudo'],
    });

    // Busca BM25
    const results = await this.search.bm25Search('documentos', query, topK, {
        idColumn: 'id',
        fields: ['titulo', 'conteudo'],
        conjunctive: false, // OR entre termos
    });

    return results;
}
```

### Busca Híbrida (Vector + BM25)

```typescript
async hybridSearch(queryText: string, queryEmbedding: number[], topK = 10) {
    // Sincroniza tabela com ambos os índices
    await this.search.syncTable('documentos', {
        columns: ['id', 'embedding', 'titulo', 'conteudo'],
        embeddingColumn: 'embedding',
        idColumn: 'id',
        textColumns: ['titulo', 'conteudo'],
    });

    // Busca híbrida
    const results = await this.search.hybridSearch(
        'documentos',
        queryEmbedding,
        queryText,
        topK,
        {
            weights: { vector: 0.7, bm25: 0.3 },
            embeddingColumn: 'embedding',
            idColumn: 'id',
            textFields: ['titulo', 'conteudo'],
        }
    );

    return results.map((r) => ({
        id: r.id,
        combinedScore: r.combinedScore,
        semanticScore: r.semanticScore,
        lexicalScore: r.lexicalScore,
    }));
}
```

## API Reference

### DuckDBSidecarService

| Método | Descrição |
|--------|-----------|
| `isSidecarReady()` | Verifica se o processo está pronto |
| `query(sql, params?)` | Executa SQL arbitrário |
| `attachPostgres(conn?, alias?)` | Anexa banco PostgreSQL |
| `installExtension(name)` | Instala extensão DuckDB |
| `syncFromPostgres(table, opts?)` | Copia dados do Postgres para memória |

### DuckDBSearchService

| Método | Descrição |
|--------|-----------|
| `syncTable(name, opts?)` | Sincroniza tabela e cria índices |
| `createVectorIndex(table, col, metric?)` | Cria índice HNSW |
| `createBM25Index(table, idCol, textCols)` | Cria índice FTS |
| `vectorSearch(table, vector, topK?, opts?)` | Busca por similaridade |
| `bm25Search(table, query, topK?, opts?)` | Busca textual BM25 |
| `hybridSearch(table, vector, text, topK?, opts?)` | Busca combinada |

## Configuração

Variáveis de ambiente necessárias:

```env
# PostgreSQL (para ATTACH automático)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Ou componentes individuais
DB_HOST=localhost
DB_PORT=5432
DB_USER=user
DB_PASS=pass
DB_NAME=dbname
```

## Monitoramento e Resiliência

### Auto-restart
- Se o processo sidecar morrer, é reiniciado automaticamente
- Máximo de 1 reinício por minuto (rate limiting)
- Health check a cada 30 segundos via ping/pong

### Logs
```
[DuckDBSidecar] Iniciando DuckDB sidecar process...
[DuckDBSidecar] DuckDB sidecar está pronto
[DuckDBSearch] Tabela documentos sincronizada com sucesso (1000 linhas)
```

## Performance Tips

1. **Memória**: O DuckDB roda em memória (`:memory:`). Ajuste `memory_limit` conforme necessário.

2. **HNSW Index**: Crie o índice APÓS inserir os dados para bulk load mais rápido:
   ```typescript
   await search.syncTable('dados', { limit: 100000 });
   await search.createVectorIndex('dados', 'embedding', 'cosine');
   ```

3. **Batch Updates**: Para grandes volumes, sincronize em batches:
   ```typescript
   for (let offset = 0; offset < total; offset += 10000) {
       await search.syncTable('dados', {
           where: `id > ${offset} AND id <= ${offset + 10000}`,
       });
   }
   ```

4. **Colunas**: Sincronize apenas colunas necessárias:
   ```typescript
   await search.syncTable('dados', {
       columns: ['id', 'embedding'], // sem colunas grandes
   });
   ```

## Troubleshooting

### Sidecar não inicia
- Verifique logs do processo filho
- Verifique se `DATABASE_URL` está configurada
- Verifique permissões de arquivo

### Queries lentas
- Verifique se índice HNSW foi criado: `PRAGMA show_indexes`
- Verifique métrica correta (CLIP = cosine)
- Limite o número de linhas sincronizadas

### Erro "DuckDB sidecar não está pronto"
- O processo pode estar reiniciando após falha
- Aguarde alguns segundos e tente novamente

## Extensões Disponíveis

O sidecar já vem com:
- `vss` - Vector Similarity Search (HNSW)
- `fts` - Full-Text Search
- `postgres` - PostgreSQL scanner
- `httpfs` - S3/HTTP access

Para instalar outras extensões:
```typescript
await sidecar.installExtension('spatial');
```
