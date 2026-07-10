/**
 * EXEMPLO DE USO - DuckDB Sidecar para Busca Vetorial e BM25
 * 
 * Este arquivo demonstra como usar o DuckDBSidecarService e DuckDBSearchService
 * em seus próprios serviços e controllers.
 */

import { Controller, Get, Injectable, Query } from '@nestjs/common';
import { DuckDBSearchService, VectorSearchResult, HybridSearchResult } from './index';

// ============================================================================
// EXEMPLO 1: Serviço de Busca de Documentos
// ============================================================================

@Injectable()
export class DocumentoSearchService {
    constructor(private readonly search: DuckDBSearchService) {}

    /**
     * Busca documentos por texto (BM25)
     */
    async buscarPorTexto(query: string, limite: number = 10) {
        // 1. Sincroniza dados do PostgreSQL (apenas na primeira vez ou quando atualizar)
        await this.search.syncTable('documento', {
            columns: ['id', 'titulo', 'conteudo', 'categoria'],
            idColumn: 'id',
            textColumns: ['titulo', 'conteudo'],
            // where: "categoria = 'publico'", // opcional: filtrar dados
        });

        // 2. Executa busca BM25
        const resultados = await this.search.bm25Search('documento', query, limite, {
            idColumn: 'id',
            fields: ['titulo', 'conteudo'],
            additionalColumns: ['titulo', 'categoria'],
        });

        return resultados;
    }

    /**
     * Busca documentos por embedding (busca semântica)
     */
    async buscarPorEmbedding(embedding: number[], limite: number = 10) {
        // Sincroniza com coluna de embedding
        await this.search.syncTable('documento', {
            columns: ['id', 'embedding', 'titulo', 'conteudo'],
            embeddingColumn: 'embedding',
        });

        // Busca por similaridade de cosseno
        const resultados = await this.search.vectorSearch('documento', embedding, limite, {
            embeddingColumn: 'embedding',
            metric: 'cosine',
            additionalColumns: ['titulo', 'conteudo'],
        });

        return resultados;
    }

    /**
     * Busca híbrida (texto + embedding)
     */
    async buscarHibrida(queryTexto: string, embedding: number[], limite: number = 10) {
        // Sincroniza com ambos os índices
        await this.search.syncTable('documento', {
            columns: ['id', 'embedding', 'titulo', 'conteudo'],
            embeddingColumn: 'embedding',
            idColumn: 'id',
            textColumns: ['titulo', 'conteudo'],
        });

        // Busca combinada
        const resultados = await this.search.hybridSearch(
            'documento',
            embedding,
            queryTexto,
            limite,
            {
                weights: { vector: 0.6, bm25: 0.4 },
                embeddingColumn: 'embedding',
                idColumn: 'id',
                textFields: ['titulo', 'conteudo'],
            }
        );

        return resultados;
    }
}

// ============================================================================
// EXEMPLO 2: Serviço de Busca de Imagens (CLIP)
// ============================================================================

@Injectable()
export class ImagemSearchService {
    constructor(private readonly search: DuckDBSearchService) {}

    /**
     * Busca imagens similares usando embeddings CLIP
     */
    async buscarImagensSimilares(clipEmbedding: number[], limite: number = 10) {
        // Sincroniza tabela de imagens
        await this.search.syncTable('imagem', {
            columns: ['id', 'embedding_clip', 'nome_arquivo', 'url'],
            embeddingColumn: 'embedding_clip',
        });

        // Busca por similaridade
        const resultados = await this.search.vectorSearch('imagem', clipEmbedding, limite, {
            embeddingColumn: 'embedding_clip',
            metric: 'cosine', // CLIP usa cosine similarity
            additionalColumns: ['nome_arquivo', 'url'],
        });

        return resultados.map((r) => ({
            id: r.id,
            similaridade: r.score,
            nomeArquivo: r.metadata?.nome_arquivo,
            url: r.metadata?.url,
        }));
    }
}

// ============================================================================
// EXEMPLO 3: Controller REST
// ============================================================================

@Controller('busca')
export class BuscaController {
    constructor(
        private readonly docSearch: DocumentoSearchService,
        private readonly imgSearch: ImagemSearchService
    ) {}

    @Get('documentos')
    async buscarDocumentos(
        @Query('q') query: string,
        @Query('tipo') tipo?: 'texto' | 'semantica' | 'hibrida',
        @Query('limite') limite: number = 10
    ) {
        if (!query) return { error: 'Query obrigatória' };

        switch (tipo) {
            case 'semantica':
                // Aqui você precisaria gerar o embedding da query
                // usando um modelo como CLIP ou sentence-transformers
                const embedding = await this.gerarEmbedding(query);
                return this.docSearch.buscarPorEmbedding(embedding, limite);

            case 'hibrida':
                const embeddingHibrido = await this.gerarEmbedding(query);
                return this.docSearch.buscarHibrida(query, embeddingHibrido, limite);

            case 'texto':
            default:
                return this.docSearch.buscarPorTexto(query, limite);
        }
    }

    @Get('imagens')
    async buscarImagens(
        @Query('embedding') embeddingStr: string,
        @Query('limite') limite: number = 10
    ) {
        // Recebe embedding como JSON string: "[0.1, 0.2, ...]"
        const embedding = JSON.parse(embeddingStr);
        return this.imgSearch.buscarImagensSimilares(embedding, limite);
    }

    private async gerarEmbedding(texto: string): Promise<number[]> {
        // Integração com modelo de embeddings (CLIP, etc.)
        // Retorna array de floats
        throw new Error('Não implementado - integrar com modelo');
    }
}

// ============================================================================
// EXEMPLO 4: Uso Avançado - Queries SQL Diretas
// ============================================================================

import { DuckDBSidecarService } from './index';

@Injectable()
export class AnaliseAvancadaService {
    constructor(private readonly sidecar: DuckDBSidecarService) {}

    async analisePersonalizada() {
        // Anexa PostgreSQL
        await this.sidecar.attachPostgres();

        // Sincroniza dados específicos
        await this.sidecar.syncFromPostgres('minha_tabela', {
            columns: ['id', 'valor', 'categoria'],
            where: 'created_at > NOW() - INTERVAL \'30 days\'',
        });

        // Query complexa com Window Functions, CTEs, etc.
        const resultado = await this.sidecar.query(`
            WITH ranked AS (
                SELECT 
                    id,
                    valor,
                    categoria,
                    ROW_NUMBER() OVER (PARTITION BY categoria ORDER BY valor DESC) as rank
                FROM minha_tabela
            )
            SELECT * FROM ranked WHERE rank <= 5
        `);

        if (resultado.success) {
            return resultado.data;
        }
        return [];
    }
}

// ============================================================================
// MÓDULO
// ============================================================================

/*
Para usar em um módulo:

import { Module } from '@nestjs/common';
import { DuckDBModule } from '../common/duckdb';
import { 
    DocumentoSearchService, 
    ImagemSearchService, 
    BuscaController,
    AnaliseAvancadaService 
} from './example-usage';

@Module({
    imports: [DuckDBModule],
    providers: [
        DocumentoSearchService,
        ImagemSearchService,
        AnaliseAvancadaService,
    ],
    controllers: [BuscaController],
    exports: [DocumentoSearchService, ImagemSearchService],
})
export class MinhaBuscaModule {}
*/
