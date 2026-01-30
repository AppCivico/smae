import { arquivo_preview_status, arquivo_preview_tipo, Prisma } from '@prisma/client';
import { ArquivoPreviewDto, ArquivoBaseDto } from './dto/arquivo-preview.dto';
import { PrismaMerge } from '../prisma/prisma.helpers';

/**
 * Constantes de configuração para geração de preview
 */
export const PreviewConfig = {
    /**
     * Tamanho máximo do arquivo original para gerar preview (em bytes)
     * Arquivos maiores que isso serão marcados como 'pulado'
     * Default: 50MB
     */
    TAMANHO_MAXIMO_BYTES: 50 * 1024 * 1024,

    EXTENSOES_IMAGEM: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
    EXTENSOES_SEM_SUPORTE: ['zip', 'rar', '7z', 'tar', 'gz', 'exe', 'bin', 'iso'],

    PREVIEW_IMAGEM_LARGURA_MAX: 800,
    PREVIEW_IMAGEM_QUALIDADE: 80,
    MIME_TYPES_IMAGEM: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],

    MIME_TYPES_SEM_SUPORTE: [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip',
    ],
} as const;

/**
 * Select padrão do Prisma para incluir campos de preview
 * Use isso nos seus findMany/findFirst
 */
export const PrismaArquivoComPreviewSelect: Prisma.ArquivoSelect = {
    id: true,
    tamanho_bytes: true,
    nome_original: true,
    diretorio_caminho: true,
    mime_type: true,
    tipo: true,
    // Campos de preview
    preview_status: true,
    preview_tipo: true,
    preview_erro_mensagem: true,
    preview_atualizado_em: true,
    preview_arquivo: {
        select: {
            id: true,
            mime_type: true,
            tamanho_bytes: true,
        },
    },
} as const;

export type PrismaArquivoComPreviewPayload = Prisma.ArquivoGetPayload<{ select: typeof PrismaArquivoComPreviewSelect }>;

/**
 * Constrói o DTO de preview a partir dos dados do Prisma
 */
export function buildArquivoPreviewDto(
    arquivo: PrismaArquivoComPreviewPayload,
    getDownloadToken: (id: number) => string
): ArquivoPreviewDto | null {
    // Se não é tipo DOCUMENTO, não tem preview
    if (arquivo.tipo !== 'DOCUMENTO') {
        return null;
    }

    // Se não tem status de preview, significa que ainda não foi solicitado
    // Isso pode acontecer em arquivos antigos antes da feature
    if (!arquivo.preview_status) {
        return {
            status: 'pendente',
            tipo: determinarTipoPreview(arquivo.nome_original, arquivo.mime_type),
            erro_mensagem: null,
            download_token: null,
            mime_type: null,
            tamanho_bytes: null,
            atualizado_em: null,
        };
    }

    const status = arquivo.preview_status as arquivo_preview_status;

    // Se o preview foi concluído e temos o arquivo de preview
    if (status === 'concluido' && arquivo.preview_arquivo) {
        return {
            status,
            tipo: arquivo.preview_tipo,
            erro_mensagem: null,
            download_token: getDownloadToken(arquivo.preview_arquivo.id),
            mime_type: arquivo.preview_arquivo.mime_type,
            tamanho_bytes: arquivo.preview_arquivo.tamanho_bytes,
            atualizado_em: arquivo.preview_atualizado_em,
        };
    }

    // Para outros status (pendente, executando, erro, sem_suporte, pulado)
    return {
        status,
        tipo: arquivo.preview_tipo || null,
        erro_mensagem: arquivo.preview_erro_mensagem,
        download_token: null,
        mime_type: null,
        tamanho_bytes: null,
        atualizado_em: arquivo.preview_atualizado_em,
    };
}

/**
 * Constrói o ArquivoBaseDto completo com preview
 */
export function BuildArquivoBaseDto(
    arquivo: PrismaArquivoComPreviewPayload,
    getDownloadToken: (id: number, expiresIn: string) => string
): ArquivoBaseDto {
    return {
        id: arquivo.id,
        descricao: null, // Deprecated, sempre null
        tamanho_bytes: arquivo.tamanho_bytes,
        nome_original: arquivo.nome_original,
        download_token: getDownloadToken(arquivo.id, '30d'),
        diretorio_caminho: arquivo.diretorio_caminho,
        preview: buildArquivoPreviewDto(arquivo, (id) => getDownloadToken(id, '30d')),
    };
}

/**
 * Determina o tipo de preview baseado no nome/mime type do arquivo
 */
export function determinarTipoPreview(nomeOriginal: string, mimeType: string | null): arquivo_preview_tipo | null {
    const extensao = extrairExtensao(nomeOriginal);

    // Verifica se é imagem
    if (PreviewConfig.EXTENSOES_IMAGEM.includes(extensao as any)) {
        return 'redimensionamento';
    }

    // Verifica mime type de imagem
    if (mimeType && PreviewConfig.MIME_TYPES_IMAGEM.includes(mimeType as any)) {
        return 'redimensionamento';
    }

    // Verifica se é JSON
    if (extensao === 'json' || mimeType === 'application/json') {
        return 'conversao_json';
    }

    // Verifica se é CSV
    if (extensao === 'csv' || mimeType === 'text/csv') {
        return 'conversao_csv';
    }

    // Verifica se é TXT
    if (extensao === 'txt' || mimeType === 'text/plain') {
        return 'conversao_txt';
    }

    // Verifica se é um tipo sem suporte
    if (PreviewConfig.EXTENSOES_SEM_SUPORTE.includes(extensao as any)) {
        return null;
    }

    // Verifica mime type sem suporte
    if (mimeType && PreviewConfig.MIME_TYPES_SEM_SUPORTE.includes(mimeType as any)) {
        return null;
    }

    // Para outros tipos, será conversão para PDF
    return 'conversao_pdf';
}

/**
 * Verifica se o arquivo deve ter preview gerado
 */
export function deveGerarPreview(
    tipo: string,
    tamanhoBytes: number,
    nomeOriginal: string,
    mimeType: string | null
): { gerar: boolean; motivo?: string; tipoPreview?: arquivo_preview_tipo } {
    // Talvez faça sentido depois gerar os previews da saida do report, mas já temos os contadores
    // então por enquanto só DOCUMENTO mesmo
    if (tipo !== 'DOCUMENTO') {
        return { gerar: false, motivo: 'Tipo de arquivo não é DOCUMENTO' };
    }

    // Verifica tamanho máximo
    if (tamanhoBytes > PreviewConfig.TAMANHO_MAXIMO_BYTES) {
        return { gerar: false, motivo: `Arquivo muito grande (${Math.round(tamanhoBytes / 1024 / 1024)}MB)` };
    }

    const extensao = extrairExtensao(nomeOriginal);

    // Verifica extensões sem suporte
    if (PreviewConfig.EXTENSOES_SEM_SUPORTE.includes(extensao as any)) {
        return { gerar: false, motivo: `Extensão .${extensao} não suportada para preview` };
    }

    // Verifica mime types sem suporte
    if (mimeType && PreviewConfig.MIME_TYPES_SEM_SUPORTE.includes(mimeType as any)) {
        return { gerar: false, motivo: `Tipo de arquivo ${mimeType} não suportado para preview` };
    }

    const tipoPreview = determinarTipoPreview(nomeOriginal, mimeType);
    if (!tipoPreview) {
        return { gerar: false, motivo: 'Não foi possível determinar tipo de preview' };
    }

    return { gerar: true, tipoPreview };
}

/**
 * Extrai a extensão do nome do arquivo (lowercase, sem ponto)
 */
function extrairExtensao(nomeOriginal: string): string {
    const partes = nomeOriginal.toLowerCase().split('.');
    return partes.length > 1 ? partes[partes.length - 1] : '';
}
