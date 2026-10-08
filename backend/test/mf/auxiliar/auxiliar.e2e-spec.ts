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

const AUTO = '/api/mf/auxiliar/auto-preencher';
const ENVIAR = '/api/mf/auxiliar/enviar-para-cp';

describe('AuxiliarController (mf/auxiliar)', () => {
    let semPrivilegio: Sessao;
    let semPapelDeMf: Sessao;
    let cpSemCiclo: Sessao;

    before(async () => {
        await bootApp();
        semPrivilegio = await criarPessoaSemPrivilegios();
        semPapelDeMf = await criarPessoaComPrivilegios(['CadastroMeta.administrador_no_pdm']);
        cpSemCiclo = await criarPessoaCpSemCiclo('PDM.tecnico_cp');
    });

    it('401 sem token', async () => {
        assertStatus(await api().patch(AUTO).send({}), 401);
        assertStatus(await api().patch(ENVIAR).send({}), 401);
    });

    it('403 sem papel de PDM (admin/técnico CP ou ponto focal)', async () => {
        for (const sessao of [semPrivilegio, semPapelDeMf]) {
            assertStatus(await api(sessao).patch(AUTO).send({ meta_id: 1, valor_realizado: '1' }), 403);
            assertStatus(await api(sessao).patch(ENVIAR).send({ meta_id: 1 }), 403);
        }
    });

    it('400 com corpo inválido em auto-preencher e enviar-para-cp', async () => {
        assertStatus(await api(cpSemCiclo).patch(AUTO).send({}), 400);
        assertStatus(await api(cpSemCiclo).patch(AUTO).send({ meta_id: 1, valor_realizado: 'abc' }), 400);
        assertStatus(await api(cpSemCiclo).patch(ENVIAR).send({}), 400);
        assertStatus(await api(cpSemCiclo).patch(ENVIAR).send({ meta_id: 1, simular_ponto_focal: 'talvez' }), 400);
    });

    it('404 "sem perfil" quando não há ciclo ativo', async () => {
        const res = await api(cpSemCiclo).patch(AUTO).send({ meta_id: 1, valor_realizado: '1' });
        assertStatus(res, 404);
        assert.match(String(res.body.message), /Você não possui um perfil de acesso/);
    });

    describe('com ciclo físico ativo', () => {
        let cp: Sessao;

        before(async () => {
            await ativaCicloFisico();
            cp = await criarPessoaCp('PDM.admin_cp');
        });

        it('404 ao preencher variável de meta fora do perfil', async () => {
            const auto = await api(cp).patch(AUTO).send({ meta_id: 999999, valor_realizado: '10' });
            assertStatus(auto, 404);
            assert.match(String(auto.body.message), /não faz parte do seu perfil/);

            const envio = await api(cp).patch(ENVIAR).send({ meta_id: 999999 });
            assertStatus(envio, 404);
            assert.match(String(envio.body.message), /não faz parte do seu perfil/);
        });
    });
});
