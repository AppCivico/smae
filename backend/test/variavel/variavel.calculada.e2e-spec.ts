import { before, describe, it } from 'node:test';
import { VariavelCalculadaService } from '../../src/variavel/variavel.calculada.service';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    getApp,
    prisma,
    Sessao,
    uniq,
} from '../lib';
import { criaGlobal, gravaSerie, processaFilaVariavel, serieVariavelDb } from './_helpers';

describe('variável calculada (fórmula composta do Plano Setorial)', () => {
    let admin: Sessao;
    let orgaoId: number;

    before(async () => {
        await bootApp();
        orgaoId = (await criarOrgao()).id;
        admin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], { orgao_id: orgaoId });
    });

    const grava = (v: number, valores: { periodo: string; valor: string }[]) =>
        gravaSerie(
            admin,
            '/api/variavel-serie',
            `/api/variavel/${v}/serie`,
            valores.map((x) => ({ ...x, tipo: 'R_' as const }))
        );

    async function criaFormula(variaveis: number[], formula: string, extra: Record<string, unknown> = {}) {
        const res = await api(admin)
            .post('/api/plano-setorial-formula-composta')
            .send({
                titulo: uniq('Calc'),
                formula,
                formula_variaveis: variaveis.map((variavel_id, i) => ({
                    referencia: `_${i + 1}`,
                    janela: 1,
                    variavel_id,
                    usar_serie_acumulada: false,
                })),
                mostrar_monitoramento: true,
                nivel_regionalizacao: null,
                orgao_id: orgaoId,
                casas_decimais: 2,
                periodicidade: 'Mensal',
                regionalizavel: false,
                inicio_medicao: '2024-01-01',
                fim_medicao: '2024-03-01',
                unidade_medida_id: -1,
                ...extra,
            });
        assertStatus(res, 201);
        return res.body.id as number;
    }

    // o cron que cria a variável calculada está desligado nos testes: roda o mesmo método que ele executa
    const rodaCronCalculada = () => getApp().get(VariavelCalculadaService)['variavelCalcCrontab']();

    const calcDaFormula = async (formulaId: number) => {
        await rodaCronCalculada();
        const fc = await prisma().formulaComposta.findUniqueOrThrow({
            where: { id: formulaId },
            select: { variavel_calc_id: true, variavel_calc_erro: true },
        });
        assert.equal(fc.variavel_calc_erro, null);
        assert.ok(fc.variavel_calc_id, 'o cron deveria ter criado a variável calculada');
        return fc.variavel_calc_id;
    };

    const calcDb = (id: number) =>
        prisma().variavel.findUniqueOrThrow({
            where: { id },
            select: {
                tipo: true,
                titulo: true,
                codigo: true,
                periodicidade: true,
                inicio_medicao: true,
                fim_medicao: true,
                casas_decimais: true,
                recalculando: true,
                recalculo_erro: true,
                orgao_proprietario_id: true,
            },
        });

    it('o cron cria a variável calculada a partir da fórmula e o refresh enfileirado a deixa pronta', async () => {
        const a = await criaGlobal(admin, orgaoId);
        const b = await criaGlobal(admin, orgaoId);
        const titulo = uniq('Média');
        const f = await criaFormula([a, b], '($_1 + $_2) / 2', { titulo, casas_decimais: 3 });

        assert.equal((await prisma().formulaComposta.findUniqueOrThrow({ where: { id: f } })).variavel_calc_id, null);
        const calc = await calcDaFormula(f);

        const criada = await calcDb(calc);
        assert.equal(criada.tipo, 'Calculada');
        assert.equal(criada.titulo, `Calculada ${titulo}`);
        assert.equal(criada.codigo, `CALC.${titulo}`);
        assert.equal(criada.periodicidade, 'Mensal');
        assert.equal(criada.casas_decimais, 3);
        assert.equal(criada.orgao_proprietario_id, orgaoId);
        assert.equal(criada.inicio_medicao?.toISOString().slice(0, 10), '2024-01-01');
        assert.equal(criada.fim_medicao?.toISOString().slice(0, 10), '2024-03-01');
        // a trigger de formula_composta enfileira o refresh_variavel
        assert.equal(criada.recalculando, true);

        assert.ok((await processaFilaVariavel(calc)) >= 1);
        const pronta = await calcDb(calc);
        assert.equal(pronta.recalculando, false);
        assert.equal(pronta.recalculo_erro, null);
        assert.deepEqual(await serieVariavelDb(calc, 'Realizado'), {}, 'sem valores nas entradas não há série');

        const fc = await prisma().formulaComposta.findUniqueOrThrow({ where: { id: f } });
        assert.equal(fc.atualizar_calc, false);
        assert.equal(
            (await rodaCronCalculada(), await prisma().variavel.count({ where: { codigo: `CALC.${titulo}` } })),
            1
        );
    });

    it('a série calculada acompanha as variáveis de entrada: cria, atualiza e remove pontos', async () => {
        const a = await criaGlobal(admin, orgaoId);
        const b = await criaGlobal(admin, orgaoId);
        const f = await criaFormula([a, b], '($_1 + $_2) / 2');
        const calc = await calcDaFormula(f);
        await processaFilaVariavel(calc);

        await grava(a, [
            { periodo: '2024-01-01', valor: '1' },
            { periodo: '2024-02-01', valor: '2' },
            { periodo: '2024-03-01', valor: '3' },
        ]);
        await grava(b, [
            { periodo: '2024-01-01', valor: '2' },
            { periodo: '2024-02-01', valor: '5' },
        ]);
        assert.equal((await calcDb(calc)).recalculando, true, 'gravar entrada invalida a calculada');
        await processaFilaVariavel(calc);
        assert.equal((await calcDb(calc)).recalculando, false);

        // março não tem B: a fórmula não gera ponto
        assert.deepEqual(await serieVariavelDb(calc, 'Realizado'), { '2024-01-01': 1.5, '2024-02-01': 3.5 });
        assert.deepEqual(await serieVariavelDb(calc, 'RealizadoAcumulado'), { '2024-01-01': 1.5, '2024-02-01': 3.5 });

        await grava(a, [{ periodo: '2024-02-01', valor: '4' }]);
        await grava(b, [{ periodo: '2024-03-01', valor: '9' }]);
        await processaFilaVariavel(calc);
        assert.deepEqual(await serieVariavelDb(calc, 'Realizado'), {
            '2024-01-01': 1.5,
            '2024-02-01': 4.5,
            '2024-03-01': 6,
        });

        await grava(b, [{ periodo: '2024-01-01', valor: '' }]);
        await processaFilaVariavel(calc);
        assert.deepEqual(await serieVariavelDb(calc, 'Realizado'), { '2024-02-01': 4.5, '2024-03-01': 6 });
    });

    it('trocar a fórmula da composta refaz a série da calculada, incluindo janela -1 (mês anterior)', async () => {
        const a = await criaGlobal(admin, orgaoId);
        const b = await criaGlobal(admin, orgaoId);
        const f = await criaFormula([a, b], '$_1 + $_2');
        const calc = await calcDaFormula(f);
        await grava(a, [
            { periodo: '2024-01-01', valor: '10' },
            { periodo: '2024-02-01', valor: '20' },
            { periodo: '2024-03-01', valor: '30' },
        ]);
        await grava(b, [
            { periodo: '2024-01-01', valor: '1' },
            { periodo: '2024-02-01', valor: '2' },
            { periodo: '2024-03-01', valor: '3' },
        ]);
        await processaFilaVariavel(calc);
        assert.deepEqual(await serieVariavelDb(calc, 'Realizado'), {
            '2024-01-01': 11,
            '2024-02-01': 22,
            '2024-03-01': 33,
        });

        const res = await api(admin)
            .patch(`/api/plano-setorial-formula-composta/${f}`)
            .send({
                formula: '$_1 + $_2',
                formula_variaveis: [
                    { referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false },
                    { referencia: '_2', janela: -1, variavel_id: b, usar_serie_acumulada: false },
                ],
            });
        assertStatus(res, 200);
        await rodaCronCalculada();
        await processaFilaVariavel(calc);
        // janeiro não tem mês anterior em B
        assert.deepEqual(await serieVariavelDb(calc, 'Realizado'), { '2024-02-01': 21, '2024-03-01': 32 });
    });

    it('400 ao criar composta do PS com referência que não está em formula_variaveis', async () => {
        const a = await criaGlobal(admin, orgaoId);
        const res = await api(admin)
            .post('/api/plano-setorial-formula-composta')
            .send({
                titulo: uniq('Inválida'),
                formula: '$_1 + $_2',
                formula_variaveis: [{ referencia: '_1', janela: 1, variavel_id: a, usar_serie_acumulada: false }],
                mostrar_monitoramento: true,
                nivel_regionalizacao: null,
                orgao_id: orgaoId,
                casas_decimais: 2,
                periodicidade: 'Mensal',
                regionalizavel: false,
                inicio_medicao: '2024-01-01',
                fim_medicao: '2024-03-01',
                unidade_medida_id: -1,
            });
        assertStatus(res, 400);
    });
});
