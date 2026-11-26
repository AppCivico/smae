import { containsNulByte, RejectNulBytesMiddleware } from './reject-nul-bytes.middleware';

describe('RejectNulBytesMiddleware', () => {
    const run = (originalUrl: string, body?: unknown) => {
        const res: any = { status: jest.fn(() => res), json: jest.fn() };
        const next = jest.fn();
        new RejectNulBytesMiddleware().use({ originalUrl, body } as any, res, next);
        return { res, next };
    };

    it('encontra NUL em valor ou chave aninhada', () => {
        expect(containsNulByte({ a: { b: ['ok', 'x\u0000'] } })).toBe(true);
        expect(containsNulByte({ a: { 'k\u0000': 1 } })).toBe(true);
        expect(containsNulByte({ a: ['<img>', 1, null] })).toBe(false);
    });

    it('devolve 400 para %00 na URL ou NUL no body', () => {
        expect(run('/api/x?palavra_chave=a%00').res.status).toHaveBeenCalledWith(400);
        expect(run('/api/x', { nome: 'a\u0000' }).res.status).toHaveBeenCalledWith(400);
    });

    it('deixa passar texto normal', () => {
        expect(run('/api/x?palavra_chave=%3Cimg%3E', { nome: '<img>' }).next).toHaveBeenCalled();
    });
});
