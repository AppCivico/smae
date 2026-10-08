import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    Sessao,
} from '../../../lib';
import { ativaCicloFisico, criarPessoaCp, criarPessoaCpSemCiclo } from '../../_helpers';

const BASE = '/api/mf/panorama';

describe('MfDashMetasController (mf/panorama)', () => {
    let semPrivilegio: Sessao;
    let cpSemCiclo: Sessao;

    before(async () => {
        await bootApp();
        semPrivilegio = await criarPessoaSemPrivilegios();
        cpSemCiclo = await criarPessoaCpSemCiclo('PDM.admin_cp');
    });

    it('401 sem token', async () => {
        assertStatus(await api().get(`${BASE}/metas`), 401);
        assertStatus(await api().get(`${BASE}/filtros-metas`), 401);
        assertStatus(await api().get(`${BASE}/etapa-hierarquia`), 401);
    });

    it('403 sem papel de PDM', async () => {
        assertStatus(await api(semPrivilegio).get(`${BASE}/metas`).query({ pdm_id: 1 }), 403);
        assertStatus(await api(semPrivilegio).get(`${BASE}/filtros-metas`), 403);
        assertStatus(await api(semPrivilegio).get(`${BASE}/etapa-hierarquia`), 403);
    });

    it('404 "sem perfil" no painel de metas sem ciclo físico ativo', async () => {
        const res = await api(cpSemCiclo).get(`${BASE}/metas`).query({ pdm_id: 1 });
        assertStatus(res, 404);
        assert.match(String(res.body.message), /Você não possui um perfil de acesso/);
    });

    describe('com ciclo físico ativo', () => {
        let pdmId: number;
        let cp: Sessao;

        before(async () => {
            pdmId = (await ativaCicloFisico()).pdm_id;
            cp = await criarPessoaCp('PDM.admin_cp');
        });

        it('400 sem pdm_id no painel de metas e com etapas_ids inválido', async () => {
            assertStatus(await api(cp).get(`${BASE}/metas`), 400);
            assertStatus(await api(cp).get(`${BASE}/etapa-hierarquia`).query({ etapas_ids: 'abc' }), 400);
        });

        it('painel de metas devolve só as listas pedidas e o perfil do usuário', async () => {
            const semFlags = await api(cp).get(`${BASE}/metas`).query({ pdm_id: pdmId });
            assertStatus(semFlags, 200);
            assert.equal(semFlags.body.perfil, 'admin_cp');
            assert.equal(semFlags.body.pendentes, null);

            const res = await api(cp)
                .get(`${BASE}/metas`)
                .query({
                    pdm_id: pdmId,
                    retornar_pendentes: true,
                    retornar_atualizadas: true,
                    retornar_atrasadas: true,
                });
            assertStatus(res, 200);
            assert.ok(Array.isArray(res.body.pendentes));
            assert.ok(Array.isArray(res.body.atualizadas));
            assert.ok(Array.isArray(res.body.atrasadas));
            assert.equal(typeof res.body.requestInfo.queryTook, 'number');
        });

        it('filtros de metas e hierarquia de etapas listam sem erro', async () => {
            const filtros = await api(cp).get(`${BASE}/filtros-metas`);
            assertStatus(filtros, 200);
            assert.ok(Array.isArray(filtros.body.linhas));

            const hierarquia = await api(cp).get(`${BASE}/etapa-hierarquia`).query({ etapas_ids: '999999' });
            assertStatus(hierarquia, 200);
            assert.deepEqual(hierarquia.body.linhas, []);
        });

        it('filtros de metas aceitam um plano setorial como pdm_id', async () => {
            const ps = await criarPlanoSetorial();
            const res = await api(cp).get(`${BASE}/filtros-metas`).query({ pdm_id: ps.id });
            assertStatus(res, 200);
            assert.ok(Array.isArray(res.body.linhas));
        });
    });
});
