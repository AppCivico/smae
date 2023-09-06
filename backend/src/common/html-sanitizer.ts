import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
const window = new JSDOM('').window;
const purify = DOMPurify(window);

export function HtmlSanitizer<T extends string | null | undefined>(html: T): T {
    if (typeof html === 'string' && html) return purify.sanitize(html) as any as T;
    return html;
}
