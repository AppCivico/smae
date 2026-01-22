import * as he from 'he';

// 1. Definir Regex fora para garantir comportamento de compilação única
const STRIP_SCRIPTS = /<(style|script)[^>]*>[\s\S]*?<\/\1>/gi;
const COLLAPSE_SPACE = /\s+/g;

/**
 * Converte HTML em texto simples preservando o tipo de entrada.
 *
 * - Se a entrada for `string`, retorna `string`.
 * - Se a entrada for `null` ou `undefined`, retorna o mesmo valor.
 *
 * Observação: usamos um genérico `T` para garantir que quando o chamador
 * passa um tipo mais específico que não inclui `null`/`undefined`, o tipo
 * de retorno também seja `string` (em vez de `string | null | undefined`).
 */
// Overloads para preservar tipos compostos (ex: `string | null` -> `string | null`)
export function Html2Text(html: string): string;
export function Html2Text(html: null): null;
export function Html2Text(html: undefined): undefined;
export function Html2Text(html: string | null): string | null;
export function Html2Text(html: string | undefined): string | undefined;
export function Html2Text(html: string | null | undefined): string | null | undefined;
export function Html2Text(html: string | null | undefined): string | null | undefined {
    // Falha rápida para vazio/nulo
    if (html === null || html === undefined) return html;

    // 2. Otimização: Pular processamento apenas se NÃO houver tags E entidades
    if (!html.includes('<') && !html.includes('&')) {
        return html.trim().replace(COLLAPSE_SPACE, ' ');
    }

    const processed = html
        // 3. Remover scripts/estilos
        .replace(STRIP_SCRIPTS, ' ')
        // 4. Converter <br> tags para newlines
        .replace(/<br\s*\/?>/gi, '\n')
        // 5. Converter listas: ul/ol com newlines antes e depois
        .replace(/<(ul|ol)[^>]*>/gi, '\n')
        .replace(/<\/(ul|ol)>/gi, '\n')
        // 6. Converter li para newline + dash
        .replace(/<li[^>]*>/gi, '\n- ')
        .replace(/<\/li>/gi, '')
        // 7. Converter <p> tags para newlines, outros blocos para espaço
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/(div|h[1-6]|tr|td|th)>/gi, ' ')
        // 8. Remover tags restantes
        .replace(/<[^>]+>/g, '');

    // 7. Decodificar entidades HTML
    const decoded = he.decode(processed);

    // 8. Normalizar espaços: colapsar múltiplos espaços, mas preservar newlines
    const normalized = decoded
        .split('\n')
        .map((line) => line.trim().replace(COLLAPSE_SPACE, ' '))
        .join('\n')
        .replace(/\n\s*\n/g, '\n') // Remove linhas vazias extras
        .trim();

    return normalized;
}
