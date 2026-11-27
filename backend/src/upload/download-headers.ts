// Tipos que o navegador exibe sem executar script; o resto (html, svg, xml...) vira download.
const MIME_INLINE_SEGURO = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/bmp',
    'text/plain',
]);

function normalizaMime(mime: string | null | undefined): string {
    return (mime ?? '').split(';')[0].trim().toLowerCase();
}

export function podeExibirInline(mime: string | null | undefined): boolean {
    const m = normalizaMime(mime);
    return MIME_INLINE_SEGURO.has(m) || m.startsWith('audio/') || m.startsWith('video/');
}

export function contentDisposition(tipo: 'inline' | 'attachment', nome: string): string {
    const ascii = nome.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    const utf8 = encodeURIComponent(nome).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return `${tipo}; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

export function headersDeDownload(
    nome: string,
    mime: string | null | undefined,
    querInline: boolean
): Record<string, string> {
    const inline = querInline && podeExibirInline(mime);
    const headers: Record<string, string> = {
        'Content-Type': mime || 'application/octet-stream',
        'Content-Disposition': contentDisposition(inline ? 'inline' : 'attachment', nome),
        'X-Content-Type-Options': 'nosniff',
    };
    // sandbox quebra o visualizador de PDF do Chrome
    if (normalizaMime(mime) !== 'application/pdf') {
        headers['Content-Security-Policy'] = "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox";
    }
    return headers;
}
