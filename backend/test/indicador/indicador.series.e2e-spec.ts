import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPlanoSetorial,
    prisma,
    Sessao,
    uniq,
} from '../lib';
import { criarIndicadorLegado, criarMetaLegado, criarMetaPS, gestorLegado, gestorPS } from '../pdm/_helpers';
import { criaGlobal, gravaSerie, processaFilaIndicador, serieIndicadorDb, serieVariavelDb } from '../variavel/_helpers';

describe('séries do indicador (PDM legado)', () => {
    let g: Sessao;
    let pdmId: number;

    before(async () => {
        await bootApp();
        g = await gestorLegado();
        pdmId = (await criarPdmAntigo()).id;
    });

    async function criaIndicador(extra: Record<string, unknown> = {}) {
        const meta = await criarMetaLegado(g, pdmId);
        return criarIndicadorLegado(g, meta, {
            periodicidade: 'Mensal',
            inicio_medicao: '2025-01-01',
            fim_medicao: '2025-04-30',
            casas_decimais: 2,
            ...extra,
        });
    }

    async function criaVariavel(indicador_id: number, extra: Record<string, unknown> = {}): Promise<number> {
        const res = await api(g)
            .post('/api/indicador-variavel')
            .send({
                codigo: uniq('V'),
                titulo: uniq('Variável'),
                periodicidade: 'Mensal',
                acumulativa: false,
                casas_decimais: 2,
                valor_base: '0',
                unidade_medida_id: -1,
                indicador_id,
                responsaveis: [g.pessoa.id],
                orgao_id: g.pessoa.orgao_id,
                ...extra,
            });
        assertStatus(res, 201);
        return res.body.id;
    }

    const salvaFormula = async (indicador_id: number, corpo: Record<string, unknown>) =>
        assertStatus(await api(g).patch(`/api/indicador/${indicador_id}`).send(corpo), 200);

    const grava = (v: number, valores: { periodo: string; tipo: 'P_' | 'R_'; valor: string }[]) =>
        gravaSerie(g, '/api/indicador-variavel-serie', `/api/indicador-variavel/${v}/serie`, valores);

    const formula2 = (a: number, b: number, formula = '$_1 + $_2', extra: Record<string, unknown> = {}) => ({
        formula,
        formula_variaveis: [
            { referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false },
            { referencia: '_2', janela: 1, variavel_id: b, usar_serie_acumulada: false },
        ],
        ...extra,
    });

    const indicadorDb = (id: number) =>
        prisma().indicador.findUniqueOrThrow({
            where: { id },
            select: { recalculando: true, recalculo_erro: true, formula_compilada: true },
        });

    it('fórmula com 2 variáveis: grava valores, enfileira o recálculo e calcula Realizado, Previsto e acumulados', async () => {
        const ind = await criaIndicador();
        const a = await criaVariavel(ind);
        const b = await criaVariavel(ind);
        await salvaFormula(ind, formula2(a, b, '$_1 + $_2', { acumulado_valor_base: '100' }));

        await grava(a, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '1' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '2' },
            { periodo: '2025-03-01', tipo: 'R_', valor: '3' },
            { periodo: '2025-01-01', tipo: 'P_', valor: '5' },
            { periodo: '2025-02-01', tipo: 'P_', valor: '5' },
        ]);
        await grava(b, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '10' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '20' },
            { periodo: '2025-01-01', tipo: 'P_', valor: '1' },
            { periodo: '2025-02-01', tipo: 'P_', valor: '2' },
        ]);

        assert.equal((await indicadorDb(ind)).recalculando, true);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), {});

        // o worker (cron) está desligado nos testes: executa a tarefa enfileirada pelo refresh_serie_indicador
        assert.ok((await processaFilaIndicador(ind)) >= 1);

        const depois = await indicadorDb(ind);
        assert.equal(depois.recalculando, false);
        assert.equal(depois.recalculo_erro, null);

        // março não tem valor em B: a fórmula não gera ponto
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), { '2025-01-01': 11, '2025-02-01': 22 });
        assert.deepEqual(await serieIndicadorDb(ind, 'Previsto'), { '2025-01-01': 6, '2025-02-01': 7 });
        // acumulado_usa_formula=false: base 100 + soma corrente, sem pontos futuros além do fim com lacuna
        assert.deepEqual(await serieIndicadorDb(ind, 'RealizadoAcumulado'), {
            '2025-01-01': 111,
            '2025-02-01': 133,
            '2025-03-01': 133,
            '2025-04-01': 133,
        });
        assert.deepEqual(await serieIndicadorDb(ind, 'PrevistoAcumulado'), {
            '2025-01-01': 106,
            '2025-02-01': 113,
            '2025-03-01': 113,
            '2025-04-01': 113,
        });

        await grava(b, [{ periodo: '2025-03-01', tipo: 'R_', valor: '30' }]);
        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), {
            '2025-01-01': 11,
            '2025-02-01': 22,
            '2025-03-01': 33,
        });
        assert.equal((await serieIndicadorDb(ind, 'RealizadoAcumulado'))['2025-03-01'], 166);

        const api_ = await api(g).get(`/api/indicador/${ind}/serie`);
        assertStatus(api_, 200);
        const marco = api_.body.linhas.find((l: { periodo: string }) => l.periodo === '2025-03');
        assert.ok(
            marco.series.some((x: { valor_nominal: string }) => x.valor_nominal === '33'),
            'API deve devolver o realizado recalculado'
        );
    });

    it('trocar a fórmula do indicador enfileira e regenera toda a série', async () => {
        const ind = await criaIndicador();
        const a = await criaVariavel(ind);
        const b = await criaVariavel(ind);
        await salvaFormula(ind, formula2(a, b));
        await grava(a, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '2' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '3' },
        ]);
        await grava(b, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '10' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '10' },
        ]);
        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), { '2025-01-01': 12, '2025-02-01': 13 });

        await salvaFormula(ind, formula2(a, b, '$_1 * $_2'));
        assert.equal((await indicadorDb(ind)).recalculando, true);
        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), { '2025-01-01': 20, '2025-02-01': 30 });

        await salvaFormula(ind, { formula: null, formula_variaveis: [] });
        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), {});
    });

    it('arredonda o resultado em casas_decimais e divisão por zero não gera ponto', async () => {
        const ind = await criaIndicador({ casas_decimais: 1 });
        const a = await criaVariavel(ind, { casas_decimais: 2 });
        const b = await criaVariavel(ind, { casas_decimais: 2 });
        await salvaFormula(ind, formula2(a, b, '$_1 / $_2'));
        await grava(a, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '10' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '1.25' },
        ]);
        await grava(b, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '3' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '0' },
        ]);
        await processaFilaIndicador(ind);

        // 10/3 = 3.33 -> 3.3; divisão por zero falha só naquele período e não derruba os demais
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), { '2025-01-01': 3.3 });
        assert.equal((await indicadorDb(ind)).recalculo_erro, null);
    });

    it('variável acumulativa: série acumulada = valor_base + soma, e fórmula pode escolher o acumulado', async () => {
        const ind = await criaIndicador();
        const a = await criaVariavel(ind, { acumulativa: true, valor_base: '10' });
        await salvaFormula(ind, {
            formula: '$_1',
            formula_variaveis: [{ referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: true }],
            acumulado_usa_formula: true,
        });
        await grava(a, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '1' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '2.5' },
            { periodo: '2025-04-01', tipo: 'R_', valor: '4' },
            { periodo: '2025-01-01', tipo: 'P_', valor: '5' },
        ]);

        assert.deepEqual(await serieVariavelDb(a, 'RealizadoAcumulado'), {
            '2025-01-01': 11,
            '2025-02-01': 13.5,
            '2025-03-01': 13.5,
            '2025-04-01': 17.5,
        });
        assert.deepEqual(await serieVariavelDb(a, 'PrevistoAcumulado'), {
            '2025-01-01': 15,
            '2025-02-01': 15,
            '2025-03-01': 15,
            '2025-04-01': 15,
        });

        await processaFilaIndicador(ind);
        const acumulado = { '2025-01-01': 11, '2025-02-01': 13.5, '2025-03-01': 13.5, '2025-04-01': 17.5 };
        // usar_serie_acumulada=true: tanto o Realizado quanto o RealizadoAcumulado do indicador leem o acumulado da variável
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), acumulado);
        assert.deepEqual(await serieIndicadorDb(ind, 'RealizadoAcumulado'), acumulado);

        await grava(a, [{ periodo: '2025-02-01', tipo: 'R_', valor: '' }]);
        assert.deepEqual(await serieVariavelDb(a, 'RealizadoAcumulado'), {
            '2025-01-01': 11,
            '2025-02-01': 11,
            '2025-03-01': 11,
            '2025-04-01': 15,
        });
        assert.deepEqual(await serieVariavelDb(a, 'Realizado'), { '2025-01-01': 1, '2025-04-01': 4 });

        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), {
            '2025-01-01': 11,
            '2025-02-01': 11,
            '2025-03-01': 11,
            '2025-04-01': 15,
        });
    });

    it('janela 3 faz média dos últimos meses e janela -1 usa o mês anterior', async () => {
        const ind = await criaIndicador();
        const a = await criaVariavel(ind);
        const b = await criaVariavel(ind);
        await salvaFormula(ind, {
            formula: '$_1 + $_2',
            formula_variaveis: [
                { referencia: '_1', janela: 3, variavel_id: a, usar_serie_acumulada: false },
                { referencia: '_2', janela: -1, variavel_id: b, usar_serie_acumulada: false },
            ],
        });
        await grava(a, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '3' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '6' },
            { periodo: '2025-03-01', tipo: 'R_', valor: '9' },
        ]);
        await grava(b, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '100' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '200' },
        ]);
        await processaFilaIndicador(ind);

        // jan não tem mês anterior em B; fev: avg(3,6)+100; mar: avg(3,6,9)+200; abr: B de março não existe
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), { '2025-02-01': 104.5, '2025-03-01': 206 });
    });

    it('variável trimestral em indicador mensal: o último valor do trimestre vale para os meses seguintes', async () => {
        const ind = await criaIndicador();
        const trimestral = await criaVariavel(ind, {
            periodicidade: 'Trimestral',
            inicio_medicao: '2025-01-01',
            fim_medicao: '2025-04-01',
        });
        const mensal = await criaVariavel(ind);
        await salvaFormula(ind, formula2(trimestral, mensal));

        const serieTri = await api(g).get(`/api/indicador-variavel/${trimestral}/serie`);
        assertStatus(serieTri, 200);
        const periodosTri = (serieTri.body.linhas as { series: { data_valor: string }[] }[]).flatMap((l) =>
            l.series.map((x) => x.data_valor)
        );
        assert.deepEqual([...new Set(periodosTri)], ['2025-01-01', '2025-04-01']);

        await grava(trimestral, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '50' },
            { periodo: '2025-04-01', tipo: 'R_', valor: '80' },
        ]);
        await grava(mensal, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '1' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '2' },
            { periodo: '2025-03-01', tipo: 'R_', valor: '3' },
            { periodo: '2025-04-01', tipo: 'R_', valor: '4' },
        ]);
        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), {
            '2025-01-01': 51,
            '2025-02-01': 52,
            '2025-03-01': 53,
            '2025-04-01': 84,
        });
    });

    it('400 com fórmula que usa referência não declarada, e nada é enfileirado', async () => {
        const ind = await criaIndicador();
        const a = await criaVariavel(ind);
        const antes = await indicadorDb(ind);
        const res = await api(g)
            .patch(`/api/indicador/${ind}`)
            .send({
                formula: '$_1 + $_2',
                formula_variaveis: [{ referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false }],
            });
        assertStatus(res, 400);
        assert.deepEqual(await indicadorDb(ind), antes);
    });

    it('PATCH parcial do indicador (só título) preserva a fórmula compilada', async () => {
        const ind = await criaIndicador();
        const a = await criaVariavel(ind);
        await salvaFormula(ind, {
            formula: '$_1',
            formula_variaveis: [{ referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false }],
        });
        const antes = (await indicadorDb(ind)).formula_compilada;
        assert.ok(antes);

        await salvaFormula(ind, { titulo: uniq('Só título') });
        assert.equal((await indicadorDb(ind)).formula_compilada, antes);
    });

    it('encurtar o fim do indicador apaga (com histórico) a série da variável e do indicador fora do período', async () => {
        const ind = await criaIndicador();
        const a = await criaVariavel(ind, { acumulativa: true });
        await salvaFormula(ind, {
            formula: '$_1',
            formula_variaveis: [{ referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false }],
        });
        await grava(a, [
            { periodo: '2025-01-01', tipo: 'R_', valor: '1' },
            { periodo: '2025-02-01', tipo: 'R_', valor: '2' },
            { periodo: '2025-03-01', tipo: 'R_', valor: '3' },
            { periodo: '2025-04-01', tipo: 'R_', valor: '4' },
        ]);
        await processaFilaIndicador(ind);
        assert.equal(Object.keys(await serieIndicadorDb(ind, 'Realizado')).length, 4);

        await salvaFormula(ind, {
            fim_medicao: '2025-02-28',
            formula: '$_1',
            formula_variaveis: [{ referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false }],
        });

        assert.deepEqual(await serieVariavelDb(a, 'Realizado'), { '2025-01-01': 1, '2025-02-01': 2 });
        const historico = await prisma().serieVariavelHistorico.findMany({
            where: { variavel_id: a, serie: 'Realizado' },
            orderBy: { data_valor: 'asc' },
        });
        assert.deepEqual(
            historico.map((h) => [h.data_valor.toISOString().slice(0, 10), Number(h.valor_nominal)]),
            [
                ['2025-03-01', 3],
                ['2025-04-01', 4],
            ]
        );

        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), { '2025-01-01': 1, '2025-02-01': 2 });
    });
});

describe('séries do indicador do Plano Setorial (variáveis globais)', () => {
    let ps: Sessao;
    let admin: Sessao;
    let orgaoId: number;
    let psId: number;

    before(async () => {
        await bootApp();
        ps = await gestorPS();
        orgaoId = (await criarOrgao()).id;
        admin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], { orgao_id: orgaoId });
        psId = (await criarPlanoSetorial({ sistema: 'PlanoSetorial' })).id;
    });

    const cliente = () => api(ps, { sistema: 'PlanoSetorial' });

    async function criaIndicadorPS(extra: Record<string, unknown> = {}): Promise<number> {
        const meta = await criarMetaPS(ps, psId, 'PlanoSetorial');
        const res = await cliente()
            .post('/api/plano-setorial-indicador')
            .send({
                codigo: uniq('IND'),
                titulo: uniq('Indicador PS'),
                polaridade: 'Positiva',
                periodicidade: 'Mensal',
                regionalizavel: false,
                casas_decimais: 2,
                inicio_medicao: '2024-01-01',
                fim_medicao: '2024-03-01',
                meta_id: meta,
                ...extra,
            });
        assertStatus(res, 201);
        return res.body.id;
    }

    const vincula = (indicador: number, ...variaveis: number[]) =>
        cliente()
            .patch(`/api/plano-setorial-indicador/${indicador}/associar-variavel`)
            .send({ variavel_ids: variaveis });

    const grava = (v: number, valores: { periodo: string; valor: string }[]) =>
        gravaSerie(
            admin,
            '/api/variavel-serie',
            `/api/variavel/${v}/serie`,
            valores.map((x) => ({ ...x, tipo: 'R_' as const }))
        );

    it('indicador sobre variáveis globais: mudar um valor da variável enfileira e recalcula o indicador', async () => {
        const ind = await criaIndicadorPS();
        const a = await criaGlobal(admin, orgaoId);
        const b = await criaGlobal(admin, orgaoId);
        assertStatus(await vincula(ind, a, b), 200);

        assertStatus(
            await cliente()
                .patch(`/api/plano-setorial-indicador/${ind}`)
                .send({
                    formula: '$_1 * 100 / $_2',
                    formula_variaveis: [
                        { referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false },
                        { referencia: '_2', janela: 1, variavel_id: b, usar_serie_acumulada: false },
                    ],
                }),
            200
        );
        await grava(a, [
            { periodo: '2024-01-01', valor: '1' },
            { periodo: '2024-02-01', valor: '2' },
        ]);
        await grava(b, [
            { periodo: '2024-01-01', valor: '4' },
            { periodo: '2024-02-01', valor: '8' },
            { periodo: '2024-03-01', valor: '3' },
        ]);
        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), { '2024-01-01': 25, '2024-02-01': 25 });

        await grava(a, [
            { periodo: '2024-02-01', valor: '4' },
            { periodo: '2024-03-01', valor: '1' },
        ]);
        const pendentes = await prisma().$queryRaw<{ n: number }[]>`
            select count(*)::int n from task_queue
            where type::text = 'refresh_indicador' and status::text = 'pending' and (params->>'indicador_id')::int = ${ind}::int`;
        assert.ok(pendentes[0].n >= 1, 'gravar a série da variável deve enfileirar o refresh do indicador');
        await processaFilaIndicador(ind);
        assert.deepEqual(await serieIndicadorDb(ind, 'Realizado'), {
            '2024-01-01': 25,
            '2024-02-01': 50,
            '2024-03-01': 33.33,
        });

        const serie = await cliente().get(`/api/plano-setorial-indicador/${ind}/serie`);
        assertStatus(serie, 200);
        const fev = serie.body.linhas.find((l: { periodo: string }) => l.periodo === '2024-02');
        assert.ok(fev.series.some((x: { valor_nominal: string }) => x.valor_nominal === '50'));
    });

    it('não desvincula variável em uso na fórmula e recusa variável que não cobre o período do indicador', async () => {
        const ind = await criaIndicadorPS();
        const a = await criaGlobal(admin, orgaoId);
        assertStatus(await vincula(ind, a), 200);
        assertStatus(
            await cliente()
                .patch(`/api/plano-setorial-indicador/${ind}`)
                .send({
                    formula: '$_1',
                    formula_variaveis: [{ referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false }],
                }),
            200
        );
        const emUso = await cliente()
            .delete(`/api/plano-setorial-indicador/${ind}/desassociar-variavel`)
            .send({ variavel_id: a });
        assertStatus(emUso, 400);
        assert.match(String(emUso.body.message), /está sendo usada em fórmulas do indicador/);

        const curta = await criaGlobal(admin, orgaoId, { fim_medicao: '2024-02-01' });
        const fim = await vincula(ind, curta);
        assertStatus(fim, 400);
        assert.match(String(fim.body.message), /termina a medição em/);

        const tardia = await criaGlobal(admin, orgaoId, { inicio_medicao: '2024-02-01', fim_medicao: '2024-03-01' });
        const inicio = await vincula(ind, tardia);
        assertStatus(inicio, 400);
        assert.match(String(inicio.body.message), /inicia a medição em/);

        const livre = await criaGlobal(admin, orgaoId);
        assertStatus(await vincula(ind, livre), 200);
        assertStatus(
            await cliente()
                .delete(`/api/plano-setorial-indicador/${ind}/desassociar-variavel`)
                .send({ variavel_id: livre }),
            200
        );
    });
});
