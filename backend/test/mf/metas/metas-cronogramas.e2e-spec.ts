import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaSemPrivilegios, Sessao } from '../../lib';
import { ativaCicloFisico, criarPessoaCp } from '../_helpers';

const BASE = '/api/mf/metas';

describe('MetasCronogramasController (mf/metas cronograma)', () => {
    let cp: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        await ativaCicloFisico();
        cp = await criarPessoaCp('PDM.admin_cp');
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    it('401 sem token', async () => {
        assertStatus(await api().get(`${BASE}/cronograma`), 401);
        assertStatus(await api().patch(`${BASE}/cronograma/etapa/1`).send({}), 401);
    });

    it('403 sem papel de PDM', async () => {
        assertStatus(await api(semPrivilegio).get(`${BASE}/cronograma`), 403);
        assertStatus(await api(semPrivilegio).get(`${BASE}/cronograma-etapa`), 403);
        assertStatus(await api(semPrivilegio).get(`${BASE}/1/iniciativas-e-atividades`), 403);
        assertStatus(await api(semPrivilegio).patch(`${BASE}/cronograma/etapa/1`).send({}), 403);
    });

    it('400 com percentual de execução acima de 100 e :id não numérico', async () => {
        const res = await api(cp).patch(`${BASE}/cronograma/etapa/1`).send({ percentual_execucao: 150 });
        assertStatus(res, 400);
        assertStatus(await api(cp).patch(`${BASE}/cronograma/etapa/abc`).send({}), 400);
    });

    it('lista cronogramas e etapas do perfil', async () => {
        const cronogramas = await api(cp).get(`${BASE}/cronograma`);
        assertStatus(cronogramas, 200);
        assert.ok(Array.isArray(cronogramas.body.linhas));

        assertStatus(await api(cp).get(`${BASE}/cronograma-etapa`), 400);
        const etapas = await api(cp).get(`${BASE}/cronograma-etapa`).query({ cronograma_id: 999999 });
        assertStatus(etapas, 200);
        assert.ok(Array.isArray(etapas.body.linhas));
    });

    it('404 ao editar etapa que não está no perfil', async () => {
        const res = await api(cp).patch(`${BASE}/cronograma/etapa/999999`).send({});
        assertStatus(res, 404);
        assert.match(String(res.body.message), /Etapa não encontrada/);
    });

    it('meta sem cronograma no perfil volta com meta null', async () => {
        const res = await api(cp).get(`${BASE}/999999/iniciativas-e-atividades`);
        assertStatus(res, 200);
        assert.deepEqual(res.body, { meta: null });
    });
});
