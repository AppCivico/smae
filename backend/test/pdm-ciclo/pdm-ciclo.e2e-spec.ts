import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    loginAsSuperAdmin,
    Sessao,
} from '../lib';

type Ciclo = { id: number; data_ciclo: string; ativo: boolean };

describe('pdm-ciclo', () => {
    let editor: Sessao;
    let semPrivilegio: Sessao;
    let admin: Sessao;

    before(async () => {
        await bootApp();
        editor = await criarPessoaComPrivilegios(['CadastroPdm.editar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        admin = await loginAsSuperAdmin();
    });

    it('401 sem token e 403 sem perfil de PDM', async () => {
        assertStatus(await api().get('/api/pdm-ciclo?pdm_id=1'), 401);

        const res = await api(semPrivilegio).get('/api/pdm-ciclo?pdm_id=1');
        assertStatus(res, 403);
        assert.match(res.body.message, /CadastroPdm\.editar/);
    });

    it('400 sem pdm_id', async () => {
        assertStatus(await api(editor).get('/api/pdm-ciclo'), 400);
        assertStatus(await api(editor).get('/api/pdm-ciclo/v2'), 400);
    });

    it('400 quando a data de fechamento não é posterior ao início do fechamento, antes de olhar o banco', async () => {
        const res = await api(editor).patch('/api/pdm-ciclo/999999').send({
            inicio_coleta: '2026-01-01',
            inicio_qualificacao: '2026-02-01',
            inicio_analise_risco: '2026-03-01',
            inicio_fechamento: '2026-04-01',
            fechamento: '2026-03-15',
        });
        assertStatus(res, 400);
        assert.match(res.body.message, /Fechamento precisa ser maior que o início do fechamento/);
    });

    it('404 para ciclo inexistente com datas em ordem', async () => {
        const res = await api(editor).patch('/api/pdm-ciclo/999999').send({
            inicio_coleta: '2026-01-01',
            inicio_qualificacao: '2026-02-01',
            inicio_analise_risco: '2026-03-01',
            inicio_fechamento: '2026-04-01',
            fechamento: '2026-05-01',
        });
        assertStatus(res, 404);
        assert.match(res.body.message, /ciclo não encontrado/);
    });

    it('ciclo configurado no Plano Setorial gera ciclos na listagem, e apenas_futuro filtra os passados', async () => {
        const ps = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
        const config = await api(admin, { sistema: 'PlanoSetorial' })
            .patch(`/api/plano-setorial/${ps.id}/ciclo-config`)
            .send({ meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], data_inicio: '2025-01-01' });
        assertStatus(config, 200);

        const lista = await api(editor).get(`/api/pdm-ciclo?pdm_id=${ps.id}`);
        assertStatus(lista, 200);
        assert.ok(lista.body.linhas.length > 0, 'nenhum ciclo gerado a partir da configuração');
        const ativos = lista.body.linhas.filter((c: Ciclo) => c.ativo);
        assert.equal(ativos.length, 1);
        assert.equal(lista.body.linhas[lista.body.linhas.length - 1].ativo, true);

        const futuros = await api(editor).get(`/api/pdm-ciclo?pdm_id=${ps.id}&apenas_futuro=true`);
        assertStatus(futuros, 200);
        assert.equal(futuros.body.linhas.length, 0);
    });

    it(
        'v2 responde para ciclo configurado no Plano Setorial',
        {
            todo: 'https://github.com/AppCivico/smae/issues/692 BUG: ciclo gerado por ciclo-config não tem fases (atualiza_ciclos_config não cria ciclo_fisico_fase), v2 lança TypeError: 500',
        },
        async () => {
            const ps = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            assertStatus(
                await api(admin, { sistema: 'PlanoSetorial' })
                    .patch(`/api/plano-setorial/${ps.id}/ciclo-config`)
                    .send({ meses: [1, 2, 3], data_inicio: '2025-01-01' }),
                200
            );
            const v2 = await api(editor).get(`/api/pdm-ciclo/v2?pdm_id=${ps.id}`);
            assertStatus(v2, 200);
            assert.ok(v2.body.linhas.length > 0);
        }
    );

    describe('/api/plano-setorial/:id/ciclo (Plano Setorial)', () => {
        let ps: { id: number };
        let cicloId: number;

        before(async () => {
            ps = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            assertStatus(
                await api(admin, { sistema: 'PlanoSetorial' })
                    .patch(`/api/plano-setorial/${ps.id}/ciclo-config`)
                    .send({ meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], data_inicio: '2025-01-01' }),
                200
            );
            cicloId = (await api(editor).get(`/api/pdm-ciclo?pdm_id=${ps.id}`)).body.linhas[0].id;
        });

        it('401 sem token e 403 sem privilégio de Plano Setorial', async () => {
            assertStatus(
                await api(undefined, { sistema: 'PlanoSetorial' }).get(`/api/plano-setorial/${ps.id}/ciclo`),
                401
            );

            const res = await api(semPrivilegio, { sistema: 'PlanoSetorial' }).get(
                `/api/plano-setorial/${ps.id}/ciclo`
            );
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroPS\.administrador/);
        });

        it('lista os ciclos do Plano Setorial pelo smae-sistemas', async () => {
            const res = await api(admin, { sistema: 'PlanoSetorial' }).get(`/api/plano-setorial/${ps.id}/ciclo`);
            assertStatus(res, 200);
            assert.ok(Array.isArray(res.body.linhas));
            assert.ok(res.body.linhas.length > 0);
        });

        it('400 na análise qualitativa sem meta_id', async () => {
            const res = await api(admin, { sistema: 'PlanoSetorial' }).get(
                `/api/plano-setorial/${ps.id}/ciclo/${cicloId}/analise`
            );
            assertStatus(res, 400);
        });
    });
});
