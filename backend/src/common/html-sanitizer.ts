import { JSDOM } from 'jsdom';
import * as DOMPurify from 'dompurify';
const window = new JSDOM('').window;
const purify = DOMPurify(window);

export function HtmlSanitize(html: string | undefined): string | undefined {
    if (html === undefined) return undefined;
    if (html) return purify.sanitize(html);
    return '';
}
