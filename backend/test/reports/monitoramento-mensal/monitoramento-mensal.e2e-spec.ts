import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
} from '../../lib';

describe('relatorio/monitoramento-mensal', () => {
    let executor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.PDM']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const url = '/api/relatorio/monitoramento-mensal';

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({ ano: 2027, mes: 3 }), 401);
    });

    it('403 sem Reports.executar.PDM', async () => {
        const res = await api(semPrivilegio).post(url).send({ ano: 2027, mes: 3 });
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.PDM/);
    });

    it('400 sem ano/mes, com ano não numérico, paineis fora de array ou tipo_pdm inválido', async () => {
        const enviar = (corpo: Record<string, unknown>) => api(executor).post(url).send(corpo);
        assertStatus(await enviar({}), 400);
        assertStatus(await enviar({ ano: 'x', mes: 3 }), 400);
        assertStatus(await enviar({ ano: 2027, mes: 3, paineis: 'x' }), 400);
        assertStatus(await enviar({ ano: 2027, mes: 3, paineis: [1.5] }), 400);
        assertStatus(await enviar({ ano: 2027, mes: 3, tipo_pdm: 'XX' }), 400);
        assertStatus(await enviar({ ano: 2027, mes: 3, tags: ['a'] }), 400);
    });

    it('201 sem ciclo físico no mês devolve monitoramento_fisico nulo e ignora painel inexistente', async () => {
        const pdm = await criarPdmAntigo();

        const res = await api(executor)
            .post(url)
            .send({ ano: 2027, mes: 4, pdm_id: pdm.id, paineis: [999999] });
        assertStatus(res, 201);
        assert.deepEqual(res.body, { monitoramento_fisico: null, paineis: [] });
    });

    it('201 com ciclo físico no mês devolve o ciclo, sem metas visíveis para o usuário', async () => {
        const pdm = await criarPdmAntigo();
        const ciclo = await prisma().cicloFisico.create({
            data: { pdm_id: pdm.id, data_ciclo: new Date('2027-03-01') },
        });

        const res = await api(executor).post(url).send({ ano: 2027, mes: 3, pdm_id: pdm.id });
        assertStatus(res, 201);
        assert.equal(res.body.monitoramento_fisico.ciclo_fisico_id, ciclo.id);
        assert.equal(res.body.monitoramento_fisico.ano, 2027);
        assert.deepEqual(res.body.monitoramento_fisico.metas, []);
        assert.deepEqual(res.body.monitoramento_fisico.seriesVariaveis, []);
        assert.deepEqual(res.body.paineis, []);
    });

    it('monitoramento_fisico.mes repete o mês pedido', async () => {
        const pdm = await criarPdmAntigo();
        await prisma().cicloFisico.create({ data: { pdm_id: pdm.id, data_ciclo: new Date('2027-03-01') } });

        const res = await api(executor).post(url).send({ ano: 2027, mes: 3, pdm_id: pdm.id });
        assertStatus(res, 201);
        assert.equal(res.body.monitoramento_fisico.mes, 3);
    });

    it('400 com mes fora de 1 a 12', async () => {
        assertStatus(await api(executor).post(url).send({ ano: 2027, mes: 13 }), 400);
    });

    it('400 com metas_ids não numérico', async () => {
        assertStatus(await api(executor).post(url).send({ ano: 2027, mes: 3, metas_ids: 'x' }), 400);
    });
});
