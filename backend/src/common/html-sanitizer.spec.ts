import { HtmlSanitizer } from './html-sanitizer';

describe('HtmlSanitizer', () => {
    it('should sanitize html input', () => {
        const dirtyHtml = '<p>This is a paragraph.</p><script>alert("Hello")</script>';
        const sanitizedHtml = '<p>This is a paragraph.</p>';

        expect(HtmlSanitizer(dirtyHtml)).toBe(sanitizedHtml);
    });

    it('should return undefined if input is undefined', () => {
        const html = undefined;
        expect(HtmlSanitizer(html)).toBeUndefined();
    });

    it('should return null if input is null', () => {
        const html = null;
        expect(HtmlSanitizer(html)).toBeNull();
    });
});
