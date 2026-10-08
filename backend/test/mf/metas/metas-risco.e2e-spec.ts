import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaSemPrivilegios, Sessao } from '../../lib';
import { ativaCicloFisico, criarPessoaCp, criarPessoaCpSemCiclo } from '../_helpers';

const RISCO = '/api/mf/metas/risco';

describe('MetasRiscoController (mf/metas/risco)', () => {
    let semPrivilegio: Sessao;
    let pontoFocal: Sessao;
    let cpSemCiclo: Sessao;

    before(async () => {
        await bootApp();
        semPrivilegio = await criarPessoaSemPrivilegios();
        pontoFocal = await criarPessoaCp('PDM.ponto_focal');
        cpSemCiclo = await criarPessoaCpSemCiclo('PDM.admin_cp');
    });

    it('401 sem token', async () => {
        assertStatus(await api().get(RISCO), 401);
        assertStatus(await api().patch(RISCO).send({}), 401);
    });

    it('403 sem admin/técnico CP, inclusive para ponto focal', async () => {
        assertStatus(await api(semPrivilegio).get(RISCO).query({ ciclo_fisico_id: 1, meta_id: 1 }), 403);
        assertStatus(await api(pontoFocal).get(RISCO).query({ ciclo_fisico_id: 1, meta_id: 1 }), 403);
        assertStatus(await api(pontoFocal).patch(RISCO).send({}), 403);
    });

    it('404 "sem perfil" sem ciclo físico ativo', async () => {
        const res = await api(cpSemCiclo).get(RISCO).query({ ciclo_fisico_id: 1, meta_id: 1 });
        assertStatus(res, 404);
        assert.match(String(res.body.message), /Você não possui um perfil de acesso/);
    });

    describe('com ciclo físico ativo', () => {
        let cicloId: number;
        let cp: Sessao;

        before(async () => {
            cicloId = (await ativaCicloFisico()).ciclo_id;
            cp = await criarPessoaCp('PDM.admin_cp');
        });

        it('400 sem ciclo_fisico_id/meta_id e com corpo vazio', async () => {
            assertStatus(await api(cp).get(RISCO), 400);
            assertStatus(await api(cp).get(RISCO).query({ ciclo_fisico_id: cicloId }), 400);
            assertStatus(await api(cp).patch(RISCO).send({}), 400);
        });

        it('lista vazia para meta sem análise de risco', async () => {
            const lista = await api(cp).get(RISCO).query({ ciclo_fisico_id: cicloId, meta_id: 999999 });
            assertStatus(lista, 200);
            assert.deepEqual(lista.body.riscos, []);
            assert.equal(typeof lista.body.requestInfo.queryTook, 'number');
        });
    });
});
