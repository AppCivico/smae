import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaSemPrivilegios, Sessao } from '../../lib';
import { ativaCicloFisico, criarPessoaCp } from '../_helpers';

const BASE = '/api/mf/metas/analise-qualitativa';

describe('MetasAnaliseQualitativaController (mf/metas/analise-qualitativa)', () => {
    let cicloId: number;
    let tecnico: Sessao;
    let pontoFocal: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        cicloId = (await ativaCicloFisico()).ciclo_id;
        tecnico = await criarPessoaCp('PDM.tecnico_cp');
        pontoFocal = await criarPessoaCp('PDM.ponto_focal');
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    it('401 sem token', async () => {
        assertStatus(await api().get(BASE), 401);
        assertStatus(await api().patch(BASE).send({}), 401);
    });

    it('403 para ponto focal e para quem não é de PDM', async () => {
        assertStatus(await api(pontoFocal).get(BASE).query({ ciclo_fisico_id: cicloId, meta_id: 1 }), 403);
        assertStatus(await api(semPrivilegio).get(BASE).query({ ciclo_fisico_id: cicloId, meta_id: 1 }), 403);
        assertStatus(await api(pontoFocal).patch(BASE).send({}), 403);
        assertStatus(await api(pontoFocal).delete(`${BASE}/documento/1`), 403);
    });

    it('400 sem ciclo_fisico_id/meta_id e com corpo vazio', async () => {
        assertStatus(await api(tecnico).get(BASE), 400);
        assertStatus(await api(tecnico).patch(BASE).send({}), 400);
        assertStatus(await api(tecnico).patch(`${BASE}/documento`).send({}), 400);
        assertStatus(await api(tecnico).delete(`${BASE}/documento/abc`), 400);
    });

    it('lista a análise qualitativa de uma meta sem análise', async () => {
        const res = await api(tecnico).get(BASE).query({ ciclo_fisico_id: cicloId, meta_id: 999999 });
        assertStatus(res, 200);
        assert.equal(typeof res.body.requestInfo.queryTook, 'number');
    });
});
