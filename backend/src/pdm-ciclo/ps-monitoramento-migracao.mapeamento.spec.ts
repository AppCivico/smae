import {
    BlocoCfgMigracao,
    FaseCfgMigracao,
    marcaUltimasRevisoes,
    normalizaRotulo,
    pendenciasMapeamento,
    sugereMapeamento,
    textoParaHtml,
    validaMapeamento,
} from './ps-monitoramento-migracao.mapeamento';

const T0 = new Date('2026-06-25T13:37:22Z');
const T1 = new Date('2026-08-01T10:00:00Z');

const bloco = (id: number, ordem: number, rotulo: string, extra: Partial<BlocoCfgMigracao> = {}): BlocoCfgMigracao => ({
    id,
    ordem,
    rotulo,
    criado_em: T0,
    atualizado_por: null,
    removido_em: null,
    ...extra,
});

const fase = (
    id: number,
    ordem: number,
    rotulo: string,
    blocos: BlocoCfgMigracao[],
    extra: Partial<FaseCfgMigracao> = {}
): FaseCfgMigracao => ({
    id,
    ordem,
    rotulo,
    habilitada: true,
    criado_em: T0,
    criado_por: -1,
    removido_em: null,
    blocos,
    ...extra,
});

// ids dos blocos do backfill saem fora de ordem (hash join): "Ponto de atenção" tem id menor que "Detalhamento"
const backfill = (): FaseCfgMigracao[] => [
    fase(41, 1, 'Qualificação', [bloco(40, 1, 'Informações complementares')]),
    fase(42, 2, 'Análise de risco', [bloco(42, 2, 'Ponto de atenção'), bloco(43, 1, 'Detalhamento')]),
    fase(43, 3, 'Tags de monitoramento', []),
    fase(44, 4, 'Fechamento', [bloco(44, 1, 'Comentário')]),
];

describe('sugereMapeamento', () => {
    it('plano do backfill mapeia por identidade e blocos pelo rótulo, não pelo id', () => {
        const { mapeamento, avisos } = sugereMapeamento(backfill());
        expect(mapeamento).toEqual({
            qualificacao_fase_id: 41,
            informacoes_complementares_bloco_id: 40,
            risco_fase_id: 42,
            detalhamento_bloco_id: 43,
            ponto_de_atencao_bloco_id: 42,
            fechamento_fase_id: 44,
            comentario_bloco_id: 44,
        });
        expect(avisos).toEqual([]);
    });

    it('identidade continua valendo após renomear, reordenar e remover (como o plano 24 da homologação)', () => {
        const fases = backfill();
        fases[0].ordem = 2;
        fases[1].ordem = 1;
        fases[1].blocos = [
            bloco(42, 2, 'Ponto de atenção', { removido_em: T1, atualizado_por: 7 }),
            bloco(43, 1, 'Det', { atualizado_por: 7 }),
            bloco(89, 2, 'PA', { criado_em: T1 }),
        ];
        fases[3].removido_em = T1;
        fases.push(fase(90, 4, 'Fechamento', [bloco(90, 1, 'Comentário', { criado_em: T1 })], { criado_em: T1 }));

        const { mapeamento, avisos } = sugereMapeamento(fases);
        expect(mapeamento.qualificacao_fase_id).toBe(41);
        expect(mapeamento.detalhamento_bloco_id).toBe(43);
        expect(mapeamento.ponto_de_atencao_bloco_id).toBe(42);
        expect(mapeamento.fechamento_fase_id).toBe(44);
        expect(avisos.length).toBe(2);
    });

    it('seed com fase renomeada por usuário não é adivinhado', () => {
        const fases = backfill().map((f) => ({ ...f, criado_por: 5 }));
        fases[0].rotulo = 'Análise qualitativa';
        const { mapeamento } = sugereMapeamento(fases);
        expect(mapeamento.qualificacao_fase_id).toBeNull();
        expect(mapeamento.risco_fase_id).toBe(42);
    });

    it('config personalizada usa o rótulo padrão, ignorando acentos e caixa', () => {
        const fases = [
            fase(70, 1, 'Coleta', [bloco(70, 1, 'Texto')], { criado_por: 5 }),
            fase(71, 2, 'analise de risco', [bloco(71, 1, 'detalhamento'), bloco(72, 2, 'PONTO DE ATENCAO')], {
                criado_por: 5,
            }),
            fase(72, 3, 'Fechamento', [bloco(73, 1, 'Observações')], { criado_por: 5 }),
        ];
        const { mapeamento } = sugereMapeamento(fases);
        expect(mapeamento.qualificacao_fase_id).toBeNull();
        expect(mapeamento.risco_fase_id).toBe(71);
        expect(mapeamento.detalhamento_bloco_id).toBe(71);
        expect(mapeamento.ponto_de_atencao_bloco_id).toBe(72);
        expect(mapeamento.fechamento_fase_id).toBe(72);
        expect(mapeamento.comentario_bloco_id).toBe(73);
    });
});

describe('validaMapeamento', () => {
    it('recusa fases repetidas e bloco de outra fase', () => {
        const { mapeamento } = sugereMapeamento(backfill());
        expect(validaMapeamento(backfill(), mapeamento)).toEqual([]);
        expect(validaMapeamento(backfill(), { ...mapeamento, fechamento_fase_id: 41 }).length).toBeGreaterThan(0);
        expect(validaMapeamento(backfill(), { ...mapeamento, comentario_bloco_id: 40 }).length).toBe(1);
        expect(validaMapeamento(backfill(), { ...mapeamento, risco_fase_id: 999 }).length).toBe(1);
    });
});

describe('pendenciasMapeamento', () => {
    it('só reclama do que tem conteúdo legado', () => {
        const vazio = {
            qualificacao_fase_id: null,
            informacoes_complementares_bloco_id: null,
            risco_fase_id: null,
            detalhamento_bloco_id: null,
            ponto_de_atencao_bloco_id: null,
            fechamento_fase_id: null,
            comentario_bloco_id: null,
        };
        const semConteudo = {
            analises: 0,
            analises_com_texto: 0,
            documentos: 0,
            riscos: 0,
            riscos_com_detalhamento: 0,
            riscos_com_ponto_de_atencao: 0,
            fechamentos: 0,
        };
        expect(pendenciasMapeamento(vazio, semConteudo)).toEqual([]);
        expect(pendenciasMapeamento(vazio, { ...semConteudo, documentos: 1, fechamentos: 3 }).length).toBe(2);
    });
});

describe('auxiliares', () => {
    it('normalizaRotulo', () => {
        expect(normalizaRotulo('  Análise   de RISCO ')).toBe('analise de risco');
    });

    it('textoParaHtml escapa e quebra linhas', () => {
        expect(textoParaHtml('a < b\nc & d')).toBe('<p>a &lt; b</p><p>c &amp; d</p>');
    });

    it('marcaUltimasRevisoes deixa uma última por meta e ciclo', () => {
        const r = (id: number, ultima: boolean, criado: string, ciclo = 1) => ({
            id,
            meta_id: 1,
            ciclo_fisico_id: ciclo,
            ultima_revisao: ultima,
            removido_em: null,
            criado_em: new Date(criado),
        });
        const ultimas = marcaUltimasRevisoes([
            r(1, false, '2026-01-01'),
            r(2, true, '2026-01-02'),
            r(3, true, '2026-01-03'),
            r(4, true, '2026-01-01', 2),
        ]);
        expect([...ultimas].sort()).toEqual([3, 4]);
    });
});
