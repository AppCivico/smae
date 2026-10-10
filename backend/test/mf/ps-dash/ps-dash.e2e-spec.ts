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

const BASE = '/api/plano-setorial/panorama';

describe('PSMFDashboardController (plano-setorial/panorama)', () => {
    let leitorPs: Sessao;
    let semPrivilegio: Sessao;
    let planoId: number;

    before(async () => {
        await bootApp();
        leitorPs = await criarPessoaComPrivilegios(['CadastroMetaPS.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        planoId = (await criarPlanoSetorial()).id;
    });

    it('401 sem token', async () => {
        assertStatus(await api().get(`${BASE}/quadro-metas`), 401);
        assertStatus(await api().get(`${BASE}/quadro-variaveis`), 401);
        assertStatus(await api().get(`${BASE}/metas`), 401);
    });

    it('403 sem papel de metas do plano setorial', async () => {
        assertStatus(await api(semPrivilegio).get(`${BASE}/quadro-metas`), 403);
        assertStatus(await api(semPrivilegio).get(`${BASE}/quadro-variaveis`), 403);
        assertStatus(await api(semPrivilegio).get(`${BASE}/metas`), 403);
    });

    it('400 com pdm_id que não é número', async () => {
        assertStatus(await api(leitorPs).get(`${BASE}/quadro-metas`).query({ pdm_id: 'abc' }), 400);
    });

    it('400 na visão administrativa sem plano setorial informado', async () => {
        const res = await api(leitorPs).get(`${BASE}/quadro-variaveis`);
        assertStatus(res, 400);
        assert.match(String(res.body.message), /Informar o Plano Setorial é obrigatório/);
    });

    it('quadro de metas do plano setorial traz as contagens', async () => {
        const res = await api(leitorPs).get(`${BASE}/quadro-metas`).query({ pdm_id: planoId });
        assertStatus(res, 200);
        for (const campo of [
            'com_pendencia',
            'sem_pendencia',
            'variaveis_liberadas',
            'variaveis_a_liberar',
            'cronograma_preenchido',
        ]) {
            assert.equal(typeof res.body[campo], 'number', campo);
        }
    });

    it('quadro de variáveis e lista de metas respondem com o formato do painel', async () => {
        const variaveis = await api(leitorPs).get(`${BASE}/quadro-variaveis`).query({ pdm_id: planoId });
        assertStatus(variaveis, 200);
        assert.ok('associadas_plano_atual' in variaveis.body);
        assert.ok('total_por_situacao' in variaveis.body);

        const metas = await api(leitorPs).get(`${BASE}/metas`).query({ pdm_id: planoId, ipp: 5 });
        assertStatus(metas, 200);
        assert.ok('ciclo_atual' in metas.body);
    });

    it('header de PDM antigo é recusado no painel do plano setorial', async () => {
        const res = await api(leitorPs, { sistema: 'PDM' }).get(`${BASE}/quadro-metas`);
        assertStatus(res, 400);
    });
});
