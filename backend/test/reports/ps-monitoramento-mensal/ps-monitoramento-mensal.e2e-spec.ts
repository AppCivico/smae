import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    Sessao,
} from '../../lib';

describe('relatorio/planos-setoriais-monitoramento-mensal', () => {
    let executorPS: Sessao;
    let executorPdM: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        executorPS = await criarPessoaComPrivilegios(['Reports.executar.PlanoSetorial']);
        executorPdM = await criarPessoaComPrivilegios(['Reports.executar.ProgramaDeMetas']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const url = '/api/relatorio/planos-setoriais-monitoramento-mensal';
    const periodo = { ano: 2027, mes: 3, listar_variaveis_regionalizadas: false };
    const vazio = { monitoramento: [], ciclo_metas: [], linhas: [], regioes: [] };

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send(periodo), 401);
    });

    it('403 sem Reports.executar.PlanoSetorial nem ProgramaDeMetas', async () => {
        const res = await api(semPrivilegio)
            .post(url)
            .send({ ...periodo, pdm_id: 1 });
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.PlanoSetorial/);
        assert.match(res.body.message, /Reports\.executar\.ProgramaDeMetas/);
    });

    it('400 com corpo vazio, mes fora de 1 a 12, ano fora do intervalo ou flag não booleana', async () => {
        const enviar = (corpo: Record<string, unknown>) =>
            api(executorPS, { sistema: 'PlanoSetorial' })
                .post(url)
                .send({ pdm_id: 1, ...corpo });
        assertStatus(await api(executorPS).post(url).send({}), 400);
        assertStatus(await enviar({ ...periodo, mes: 13 }), 400);
        assertStatus(await enviar({ ...periodo, mes: 0 }), 400);
        assertStatus(await enviar({ ...periodo, ano: 1000 }), 400);
        assertStatus(await enviar({ ...periodo, listar_variaveis_regionalizadas: 'sim' }), 400);
        assertStatus(await enviar({ ...periodo, tipo_pdm: 'XX' }), 400);
        assertStatus(await enviar({ ...periodo, tags: ['a'] }), 400);
    });

    it('400 sem pdm_id', async () => {
        const res = await api(executorPS, { sistema: 'PlanoSetorial' }).post(url).send(periodo);
        assertStatus(res, 400);
        assert.match(res.body.message, /pdm_id/);
    });

    it('201 em plano setorial sem metas devolve as quatro listas vazias', async () => {
        const plano = await criarPlanoSetorial();

        const res = await api(executorPS, { sistema: 'PlanoSetorial' })
            .post(url)
            .send({ ...periodo, pdm_id: plano.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, vazio);
    });

    it('aceita plano_setorial_id (deprecado) no lugar de pdm_id', async () => {
        const plano = await criarPlanoSetorial();

        const res = await api(executorPS, { sistema: 'PlanoSetorial' })
            .post(url)
            .send({ ...periodo, plano_setorial_id: plano.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, vazio);
    });

    it('Reports.executar.ProgramaDeMetas basta com o header ProgramaDeMetas', async () => {
        const plano = await criarPlanoSetorial({ sistema: 'ProgramaDeMetas' });

        const res = await api(executorPdM, { sistema: 'ProgramaDeMetas' })
            .post(url)
            .send({ ...periodo, pdm_id: plano.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, vazio);
    });

    it('privilégio PlanoSetorial é descartado quando o header é ProgramaDeMetas', async () => {
        const res = await api(executorPS, { sistema: 'ProgramaDeMetas' })
            .post(url)
            .send({ ...periodo, pdm_id: 1 });
        assertStatus(res, 400);
        assert.match(res.body.message, /não tem mais permissões/);
    });
});
