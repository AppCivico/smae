import { PrismaMerge } from './prisma.helpers';

describe('PrismaMerge', () => {
    it('mantém todas as chaves dos dois lados e manda as repetidas para o AND', () => {
        expect(
            PrismaMerge<any>(
                { AND: [{ a: 1 }], OR: [{ b: 2 }], NOT: { c: 3 }, d: 4 },
                { AND: [{ x: 9 }], OR: [{ y: 8 }], NOT: { z: 7 }, d: 5, e: 6 }
            )
        ).toEqual({
            AND: [{ a: 1 }, { x: 9 }, { OR: [{ y: 8 }] }, { d: 5 }],
            OR: [{ b: 2 }],
            NOT: [{ c: 3 }, { z: 7 }],
            d: 4,
            e: 6,
        });
    });

    it('não deixa um filtro de relação sobrescrever outro na mesma relação', () => {
        const permissao = { variavel: { orgao_id: { in: [1, 2] } } };
        const filtro = { variavel: { orgao_id: 99 } };

        expect(PrismaMerge<any>(permissao, filtro)).toEqual({ ...permissao, AND: [filtro] });
    });

    it('mantém dois OR como duas condições, sem juntar num OR mais largo', () => {
        expect(PrismaMerge<any>({ OR: [{ a: 1 }, { b: 2 }] }, { OR: [{ c: 3 }, { d: 4 }] })).toEqual({
            OR: [{ a: 1 }, { b: 2 }],
            AND: [{ OR: [{ c: 3 }, { d: 4 }] }],
        });
    });

    it('trata undefined como sem filtro dos dois lados', () => {
        expect(PrismaMerge<any>({ a: undefined, b: 1 }, { a: 2, b: undefined })).toEqual({ a: 2, b: 1 });
    });

    it('não altera os objetos de entrada', () => {
        const base = { AND: [{ a: 1 }], d: 4 };
        const extensao = { AND: [{ x: 9 }], d: 5 };
        PrismaMerge<any>(base, extensao);

        expect(base).toEqual({ AND: [{ a: 1 }], d: 4 });
        expect(extensao).toEqual({ AND: [{ x: 9 }], d: 5 });
    });

    describe('formatos usados hoje', () => {
        it('permissões em AND com filtro de pdm_id ou OR (painel de variáveis)', () => {
            const permissoes = { AND: [{ variavel: { removido_em: null } }] };
            const temPdm = { pdm_id: { hasSome: [1] } };
            const semPdmMasNao = { OR: [{ pdm_id: { isEmpty: true } }, { NOT: { pdm_id: { hasSome: [1] } } }] };

            expect(PrismaMerge<any>(permissoes, temPdm)).toEqual({ ...permissoes, ...temPdm });
            expect(PrismaMerge<any>(permissoes, semPdmMasNao)).toEqual({ ...permissoes, ...semPdmMasNao });
        });

        it('acrescenta AND num filtro sem AND (relatório de orçamento)', () => {
            const filtroBase = { sobrescrito_em: null, OrcamentoRealizado: { removido_em: null } };
            const and = [{ OrcamentoRealizado: { OR: [{ dotacao: { startsWith: '16.' } }] } }];

            expect(PrismaMerge<any>(filtroBase, { AND: and })).toEqual({ ...filtroBase, AND: and });
        });

        it('concatena com um AND já existente, objeto ou lista', () => {
            expect(PrismaMerge<any>({ AND: { a: 1 } }, { AND: { b: 2 } })).toEqual({ AND: [{ a: 1 }, { b: 2 }] });
            expect(PrismaMerge<any>({ AND: [{ a: 1 }] }, { AND: [{ b: 2 }, { c: 3 }] })).toEqual({
                AND: [{ a: 1 }, { b: 2 }, { c: 3 }],
            });
        });
    });
});
