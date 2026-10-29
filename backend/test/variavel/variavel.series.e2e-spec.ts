import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao } from '../lib';
import { criaGlobal, gravaSerie, processaFilaVariavel, SerieCorpo, serieVariavelDb, valorDaSerie } from './_helpers';

describe('séries de variável global', () => {
    let admin: Sessao;
    let orgaoId: number;

    before(async () => {
        await bootApp();
        orgaoId = (await criarOrgao()).id;
        admin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], { orgao_id: orgaoId });
    });

    const grava = (v: number, valores: { periodo: string; valor: string; tipo?: 'P_' | 'R_' }[]) =>
        gravaSerie(
            admin,
            '/api/variavel-serie',
            `/api/variavel/${v}/serie`,
            valores.map((x) => ({ tipo: 'R_' as const, ...x }))
        );

    const patch = async (v: number, corpo: Record<string, unknown>) =>
        assertStatus(await api(admin).patch(`/api/variavel/${v}`).send(corpo), 200);

    it('acumulativa: o acumulado é valor_base + soma e é recalculado ao gravar, apagar, mudar base e desligar acumulativa', async () => {
        const v = await criaGlobal(admin, orgaoId, { acumulativa: true, valor_base: '10' });
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), {
            '2024-01-01': 10,
            '2024-02-01': 10,
            '2024-03-01': 10,
        });

        await grava(v, [
            { periodo: '2024-01-01', valor: '1' },
            { periodo: '2024-02-01', valor: '2.5' },
            { periodo: '2024-01-01', valor: '3', tipo: 'P_' },
        ]);
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), {
            '2024-01-01': 11,
            '2024-02-01': 13.5,
            '2024-03-01': 13.5,
        });
        assert.deepEqual(await serieVariavelDb(v, 'PrevistoAcumulado'), {
            '2024-01-01': 13,
            '2024-02-01': 13,
            '2024-03-01': 13,
        });

        await patch(v, { valor_base: '20' });
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), {
            '2024-01-01': 21,
            '2024-02-01': 23.5,
            '2024-03-01': 23.5,
        });

        await grava(v, [{ periodo: '2024-01-01', valor: '' }]);
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), {
            '2024-01-01': 20,
            '2024-02-01': 22.5,
            '2024-03-01': 22.5,
        });

        await patch(v, { acumulativa: false });
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), { '2024-02-01': 2.5 });
        assert.deepEqual(await serieVariavelDb(v, 'Realizado'), { '2024-02-01': 2.5 });
    });

    it('o refresh enfileirado ao criar/gravar deixa recalculando=false depois de processado', async () => {
        const v = await criaGlobal(admin, orgaoId);
        const antes = await prisma().variavel.findUniqueOrThrow({ where: { id: v }, select: { recalculando: true } });
        assert.equal(antes.recalculando, true);
        await grava(v, [{ periodo: '2024-01-01', valor: '1' }]);
        assert.ok((await processaFilaVariavel(v)) >= 1);
        const depois = await prisma().variavel.findUniqueOrThrow({
            where: { id: v },
            select: { recalculando: true, recalculo_erro: true, recalculo_tempo: true },
        });
        assert.equal(depois.recalculando, false);
        assert.equal(depois.recalculo_erro, null);
        assert.notEqual(depois.recalculo_tempo, null);
    });

    it('trimestral: só existem os períodos do trimestre e o acumulado anda de trimestre em trimestre', async () => {
        const v = await criaGlobal(admin, orgaoId, {
            periodicidade: 'Trimestral',
            acumulativa: true,
            inicio_medicao: '2024-01-01',
            fim_medicao: '2024-10-01',
        });
        const periodos = await api(admin).get(`/api/variavel/${v}/periodos-validos`);
        assertStatus(periodos, 200);
        assert.deepEqual(periodos.body.periodos_validos, ['2024-01-01', '2024-04-01', '2024-07-01', '2024-10-01']);

        const serie = await api(admin).get(`/api/variavel/${v}/serie`);
        assertStatus(serie, 200);
        const datas = (serie.body as SerieCorpo).linhas.flatMap((l) => l.series.map((x) => x.data_valor));
        assert.deepEqual([...new Set(datas)], periodos.body.periodos_validos);
        assert.equal(valorDaSerie(serie.body, '2024-02-01', 'R_'), undefined);

        await grava(v, [
            { periodo: '2024-01-01', valor: '5' },
            { periodo: '2024-07-01', valor: '7' },
        ]);
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), {
            '2024-01-01': 5,
            '2024-04-01': 5,
            '2024-07-01': 12,
            '2024-10-01': 12,
        });
    });

    it('reduzir fim_medicao de global não deixa linhas de série acumulada fora do período', async () => {
        const v = await criaGlobal(admin, orgaoId, { acumulativa: true });
        await grava(v, [{ periodo: '2024-01-01', valor: '1' }]);
        await patch(v, { fim_medicao: '2024-02-01' });
        const acumulado = await serieVariavelDb(v, 'RealizadoAcumulado');
        assert.deepEqual(Object.keys(acumulado), ['2024-01-01', '2024-02-01']);
    });
});
