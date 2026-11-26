import { quoteTsQueryLexeme } from './escape-tsquery';

describe('quoteTsQueryLexeme', () => {
    it('quota o termo como lexema único', () => {
        expect(quoteTsQueryLexeme('<img>')).toBe("'<img>'");
        expect(quoteTsQueryLexeme("it's a\\b")).toBe("'it''s a\\\\b'");
    });
});
