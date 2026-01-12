import he from 'he';

// 1. Definir Regex fora para garantir comportamento de compilação única
const STRIP_SCRIPTS = /<(style|script)[^>]*>[\s\S]*?<\/\1>/gi;
const STRIP_TAGS = /<[^>]+>/g;
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

    const stripped = html
        // 3. Remover scripts/estilos
        .replace(STRIP_SCRIPTS, '')
        // 4. Remover tags restantes
        .replace(STRIP_TAGS, '');

    // 5. Decodificar entidades e normalizar espaços em branco
    // Nota: he.decode trata coisas como &nbsp; -> \xA0 (espaço não-quebrável)
    // O replace final (COLLAPSE_SPACE) transforma \xA0 e \n em espaços padrão 0x20
    return he.decode(stripped).trim().replace(COLLAPSE_SPACE, ' ');
}
