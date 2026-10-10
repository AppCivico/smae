import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    Sessao,
} from '../../lib';
import { ativaCicloFisico, criarPessoaCp, criarPessoaCpSemCiclo } from '../_helpers';

const FECHAMENTO = '/api/mf/metas/fechamento';

describe('MetasFechamentoController (mf/metas/fechamento)', () => {
    let semPrivilegio: Sessao;
    let semPapelDeMf: Sessao;
    let pontoFocal: Sessao;
    let cpSemCiclo: Sessao;

    before(async () => {
        await bootApp();
        semPrivilegio = await criarPessoaSemPrivilegios();
        semPapelDeMf = await criarPessoaComPrivilegios(['CadastroMeta.listar']);
        pontoFocal = await criarPessoaCp('PDM.ponto_focal');
        cpSemCiclo = await criarPessoaCpSemCiclo('PDM.tecnico_cp');
    });

    it('401 sem token', async () => {
        assertStatus(await api().get(FECHAMENTO), 401);
        assertStatus(await api().patch(FECHAMENTO).send({}), 401);
    });

    it('403 sem técnico/admin CP (ponto focal não fecha meta)', async () => {
        assertStatus(await api(semPrivilegio).get(FECHAMENTO).query({ ciclo_fisico_id: 1, meta_id: 1 }), 403);
        assertStatus(await api(semPapelDeMf).get(FECHAMENTO).query({ ciclo_fisico_id: 1, meta_id: 1 }), 403);
        assertStatus(await api(pontoFocal).get(FECHAMENTO).query({ ciclo_fisico_id: 1, meta_id: 1 }), 403);
        assertStatus(await api(pontoFocal).patch(FECHAMENTO).send({}), 403);
    });

    it('404 "sem perfil" sem ciclo físico ativo', async () => {
        const res = await api(cpSemCiclo).get(FECHAMENTO).query({ ciclo_fisico_id: 1, meta_id: 1 });
        assertStatus(res, 404);
        assert.match(String(res.body.message), /Você não possui um perfil de acesso/);
    });

    describe('com ciclo físico ativo', () => {
        let cicloId: number;
        let cp: Sessao;

        before(async () => {
            cicloId = (await ativaCicloFisico()).ciclo_id;
            cp = await criarPessoaCp('PDM.tecnico_cp');
        });

        it('400 sem parâmetros obrigatórios e com corpo vazio', async () => {
            assertStatus(await api(cp).get(FECHAMENTO), 400);
            assertStatus(await api(cp).patch(FECHAMENTO).send({}), 400);
            assertStatus(await api(cp).patch(FECHAMENTO).send({ ciclo_fisico_id: cicloId, meta_id: 1 }), 400);
        });

        it('lista vazia para meta sem fechamento', async () => {
            const lista = await api(cp).get(FECHAMENTO).query({ ciclo_fisico_id: cicloId, meta_id: 999999 });
            assertStatus(lista, 200);
            assert.deepEqual(lista.body.fechamentos, []);
        });
    });
});
