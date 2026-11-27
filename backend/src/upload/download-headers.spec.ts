import { contentDisposition, headersDeDownload, podeExibirInline } from './download-headers';

describe('download-headers', () => {
    it.each([
        ['application/pdf', true],
        ['image/png', true],
        ['IMAGE/JPEG; charset=binary', true],
        ['video/mp4', true],
        ['image/svg+xml', false],
        ['text/html', false],
        ['application/xhtml+xml', false],
        ['text/xml', false],
        ['application/octet-stream', false],
        [null, false],
    ])('podeExibirInline(%s) = %s', (mime, esperado) => {
        expect(podeExibirInline(mime)).toBe(esperado);
    });

    it('html pedido inline vira attachment com sandbox', () => {
        const h = headersDeDownload('x.html', 'text/html', true);
        expect(h['Content-Disposition']).toMatch(/^attachment;/);
        expect(h['Content-Security-Policy']).toContain('sandbox');
        expect(h['X-Content-Type-Options']).toBe('nosniff');
    });

    it('pdf inline sem CSP para não quebrar o visualizador', () => {
        const h = headersDeDownload('doc.pdf', 'application/pdf', true);
        expect(h['Content-Disposition']).toMatch(/^inline;/);
        expect(h['Content-Security-Policy']).toBeUndefined();
    });

    it('imagem sem inline continua attachment', () => {
        expect(headersDeDownload('a.png', 'image/png', false)['Content-Disposition']).toMatch(/^attachment;/);
    });

    it('nome com aspas, quebra de linha e acento não quebra o header', () => {
        const v = contentDisposition('inline', 'relatório "final"\r\n.pdf');
        expect(v).not.toMatch(/[\r\n]/);
        expect(v).toContain('filename="relat_rio _final___.pdf"');
        expect(v).toContain("filename*=UTF-8''relat%C3%B3rio%20%22final%22%0D%0A.pdf");
    });
});
