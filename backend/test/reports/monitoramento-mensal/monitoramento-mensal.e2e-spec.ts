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

    it('metas trazem as fases configuráveis do ciclo', async () => {
        const admin = await criarPessoaComPrivilegios([
            'Reports.executar.PDM',
            'CadastroMeta.administrador_no_pdm_admin_cp',
        ]);
        const pdm = await criarPdmAntigo();
        const db = prisma();
        const autor = admin.pessoa.id;
        await db.pdm.update({ where: { id: pdm.id }, data: { monitoramento_por_blocos: true } });
        const data_ciclo = new Date('2027-03-01');
        const ciclo = await db.cicloFisico.create({ data: { pdm_id: pdm.id, data_ciclo } });
        const meta = await db.meta.create({
            data: { pdm_id: pdm.id, status: 'Ativo', codigo: 'M-MF', titulo: 'Meta MF' },
        });
        const fase = await db.pdmMonitoramentoFaseConfig.create({
            data: { pdm_id: pdm.id, ordem: 1, rotulo: 'Qualificação', criado_por: autor },
        });
        const bloco = await db.pdmMonitoramentoBlocoConfig.create({
            data: { fase_id: fase.id, ordem: 1, rotulo: 'Texto', criado_por: autor },
        });
        await db.metaMonitoramentoFase.create({
            data: {
                meta_id: meta.id,
                ciclo_fisico_id: ciclo.id,
                fase_config_id: fase.id,
                referencia_data: data_ciclo,
                ultima_revisao: true,
                fecha_ciclo: true,
                criado_por: autor,
                blocos: { create: [{ bloco_config_id: bloco.id, conteudo: '<p>ok</p>' }] },
            },
        });

        const res = await api(admin).post(url).send({ ano: 2027, mes: 3, pdm_id: pdm.id });
        assertStatus(res, 201);
        const [item] = res.body.monitoramento_fisico.metas;
        assert.equal(item.meta.id, meta.id);
        assert.equal(item.ciclo_fechado, true);
        assert.equal(item.fases.length, 1);
        assert.equal(item.fases[0].config.fecha_ciclo, true);
        assert.equal(item.fases[0].revisao.blocos[0].conteudo_texto, 'ok');
    });
});
