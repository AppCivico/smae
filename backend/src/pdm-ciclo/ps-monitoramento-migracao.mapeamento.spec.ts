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
    habilitado: true,
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
    aceita_tags: false,
    aceita_anexos: true,
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
    fase(43, 3, 'Tags de monitoramento', [], { aceita_tags: true }),
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

    it('seed com fase renomeada por usuário cai na fase livre, com aviso', () => {
        const fases = backfill().map((f) => ({ ...f, criado_por: 5 }));
        fases[0].rotulo = 'Análise qualitativa';
        const { mapeamento, avisos } = sugereMapeamento(fases);
        expect(mapeamento.qualificacao_fase_id).toBe(41);
        expect(mapeamento.informacoes_complementares_bloco_id).toBe(40);
        expect(mapeamento.risco_fase_id).toBe(42);
        expect(avisos).toEqual([
            'Nenhuma fase corresponde a "Qualificação"; o conteúdo vai para "Análise qualitativa"',
        ]);
    });

    it('layout próprio do usuário (plano 41 de produção) migra pela ordem de exibição', () => {
        const fases = [
            fase(66, 1, 'Tags de monitoramento', [], { criado_por: 29, aceita_tags: true }),
            fase(
                67,
                2,
                'Qualificação',
                [bloco(68, 1, 'Escopo', { atualizado_por: 29 }), bloco(75, 2, 'BR 2026', { criado_em: T1 })],
                {
                    criado_por: 29,
                }
            ),
            fase(
                68,
                3,
                'Monitoramento',
                [
                    bloco(69, 1, 'Detalhamento', { atualizado_por: 29 }),
                    bloco(70, 2, 'Ponto de atenção', { atualizado_por: 29 }),
                    bloco(71, 3, 'Empreendimentos vinculados', { atualizado_por: 29 }),
                    bloco(76, 4, 'Fechamento', { criado_em: T1 }),
                ],
                { criado_por: 29 }
            ),
            fase(
                69,
                4,
                'Relatório',
                [
                    bloco(72, 1, 'Status Relatório', { atualizado_por: 29 }),
                    bloco(73, 2, 'Evolução da Meta', { atualizado_por: 29 }),
                    bloco(74, 3, 'Resultado', { atualizado_por: 29 }),
                ],
                { criado_por: 29 }
            ),
        ];
        const { mapeamento, avisos } = sugereMapeamento(fases);
        expect(mapeamento).toEqual({
            qualificacao_fase_id: 67,
            informacoes_complementares_bloco_id: 68,
            risco_fase_id: 68,
            detalhamento_bloco_id: 69,
            ponto_de_atencao_bloco_id: 70,
            fechamento_fase_id: 69,
            comentario_bloco_id: 72,
        });
        expect(avisos).toEqual([
            'Nenhuma fase corresponde a "Análise de risco"; o conteúdo vai para "Monitoramento"',
            'Nenhuma fase corresponde a "Fechamento"; o conteúdo vai para "Relatório"',
            'Nenhum bloco corresponde a "Comentário"; o conteúdo vai para "Status Relatório"',
        ]);
    });

    it('fallback da qualificação prefere fase que aceita anexos e pula blocos desabilitados', () => {
        const fases = [
            fase(80, 1, 'Resumo', [bloco(80, 1, 'Texto')], { criado_por: 5, aceita_anexos: false }),
            fase(
                81,
                2,
                'Evidências',
                [bloco(81, 1, 'Oculto', { habilitado: false, atualizado_por: 5 }), bloco(82, 2, 'Notas')],
                {
                    criado_por: 5,
                }
            ),
            fase(82, 3, 'Encerramento', [bloco(83, 1, 'Parecer')], { criado_por: 5, aceita_anexos: false }),
        ];
        const { mapeamento } = sugereMapeamento(fases);
        expect(mapeamento.qualificacao_fase_id).toBe(81);
        expect(mapeamento.informacoes_complementares_bloco_id).toBe(82);
        expect(mapeamento.risco_fase_id).toBe(80);
        expect(mapeamento.fechamento_fase_id).toBe(82);
    });

    it('blocos renomeados e editados caem nos blocos livres pela ordem (plano 32 da demo)', () => {
        const fases = backfill();
        fases[0].rotulo = 'Informações preliminares';
        fases[0].blocos = [
            bloco(40, 1, 'Contexto da meta', { atualizado_por: 7 }),
            bloco(57, 2, 'Observações', { criado_em: T1 }),
        ];
        fases[1].rotulo = 'Monitoramento';
        fases[1].blocos = [
            bloco(42, 2, 'Entregas', { atualizado_por: 7 }),
            bloco(43, 1, 'Status', { atualizado_por: 7 }),
            bloco(58, 3, 'Projeções', { criado_em: T1 }),
        ];
        const { mapeamento } = sugereMapeamento(fases);
        expect(mapeamento.informacoes_complementares_bloco_id).toBe(40);
        expect(mapeamento.detalhamento_bloco_id).toBe(43);
        expect(mapeamento.ponto_de_atencao_bloco_id).toBe(42);
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
        expect(mapeamento.qualificacao_fase_id).toBe(70);
        expect(mapeamento.informacoes_complementares_bloco_id).toBe(70);
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
