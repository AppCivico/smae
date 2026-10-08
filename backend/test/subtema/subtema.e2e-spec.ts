import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

async function criarMeta(pdm_id: number, extra: Record<string, unknown>) {
    return prisma().meta.create({
        data: { pdm_id, status: 'Registrado', codigo: uniq('M').replace(/\s+/g, '-'), titulo: uniq('Meta'), ...extra },
    });
}

describe('subtema', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let semPdm: Sessao;
    let pdmId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroSubTema.inserir',
            'CadastroSubTema.editar',
            'CadastroSubTema.remover',
            'CadastroPdm.editar',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        semPdm = await criarPessoaComPrivilegios([
            'CadastroSubTema.inserir',
            'CadastroSubTema.editar',
            'CadastroSubTema.remover',
        ]);
        pdmId = (await criarPdmAntigo()).id;
    });

    const nova = (extra: Record<string, unknown> = {}) => ({ descricao: uniq('Sub-tema'), pdm_id: pdmId, ...extra });

    describe('/api/subtema (PDM antigo)', () => {
        describe('autenticação e privilégios', () => {
            it('401 sem token', async () => {
                assertStatus(await api().get('/api/subtema'), 401);
                assertStatus(await api().post('/api/subtema').send(nova()), 401);
                assertStatus(await api().delete('/api/subtema/1'), 401);
            });

            it('403 sem CadastroSubTema.* e 403 sem CadastroPdm.editar', async () => {
                assertStatus(await api(semPrivilegio).post('/api/subtema').send(nova()), 403);
                assertStatus(await api(semPdm).post('/api/subtema').send(nova()), 403);
            });
        });

        describe('validação', () => {
            it('400 sem descricao ou sem pdm_id', async () => {
                assertStatus(await api(gestor).post('/api/subtema').send({ pdm_id: pdmId }), 400);
                assertStatus(await api(gestor).post('/api/subtema').send({ descricao: uniq() }), 400);
            });

            it('400 com pdm_id inexistente', async () => {
                const res = await api(gestor)
                    .post('/api/subtema')
                    .send(nova({ pdm_id: 999999 }));
                assertStatus(res, 400);
                assert.match(res.body.message, /não encontrado ou removido/);
            });
        });

        describe('CRUD', () => {
            it('cria, lê, lista por pdm, edita e remove', async () => {
                const descricao = uniq('Habitação');
                const criado = await api(gestor).post('/api/subtema').send(nova({ descricao }));
                assertStatus(criado, 201);
                const id: number = criado.body.id;

                const lido = await api(gestor).get(`/api/subtema/${id}`);
                assertStatus(lido, 200);
                assert.deepEqual(lido.body, { id, descricao, pdm_id: pdmId });

                const lista = await api(gestor).get('/api/subtema').query({ pdm_id: pdmId });
                assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === id));

                const nova2 = uniq('Habitação popular');
                assertStatus(await api(gestor).patch(`/api/subtema/${id}`).send({ descricao: nova2 }), 200);
                assert.equal((await api(gestor).get(`/api/subtema/${id}`)).body.descricao, nova2);

                assertStatus(await api(gestor).delete(`/api/subtema/${id}`), 202);
                assertStatus(await api(gestor).get(`/api/subtema/${id}`), 404);
            });
        });

        describe('unicidade por PDM e uso em metas', () => {
            it('400 com descrição igual no mesmo PDM, aceita em outro PDM', async () => {
                const descricao = uniq('Mobilidade');
                assertStatus(await api(gestor).post('/api/subtema').send(nova({ descricao })), 201);

                const dup = await api(gestor)
                    .post('/api/subtema')
                    .send(nova({ descricao: descricao.toUpperCase() }));
                assertStatus(dup, 400);
                assert.match(dup.body.message, /Já existe um Sub-tema com esta descrição/);

                const outroPdm = (await criarPdmAntigo()).id;
                assertStatus(
                    await api(gestor)
                        .post('/api/subtema')
                        .send(nova({ descricao, pdm_id: outroPdm })),
                    201
                );
            });

            it('400 ao remover subtema usado em meta, liberado depois que a meta é removida', async () => {
                const criado = await api(gestor).post('/api/subtema').send(nova());
                assertStatus(criado, 201);
                const meta = await criarMeta(pdmId, { sub_tema_id: criado.body.id });

                const emUso = await api(gestor).delete(`/api/subtema/${criado.body.id}`);
                assertStatus(emUso, 400);
                assert.match(emUso.body.message, /em uso em Metas/);

                await prisma().meta.update({ where: { id: meta.id }, data: { removido_em: new Date() } });
                assertStatus(await api(gestor).delete(`/api/subtema/${criado.body.id}`), 202);
            });
        });
    });

    describe('/api/plano-setorial-subtema (PS)', () => {
        it('cria e lista no PS, e não aparece na listagem do PDM antigo', async () => {
            const psPdm = await criarPlanoSetorial();
            const admin = await loginAsSuperAdmin();
            const criado = await api(admin)
                .post('/api/plano-setorial-subtema')
                .send(nova({ pdm_id: psPdm.id }));
            assertStatus(criado, 201);

            const ps = await api(admin).get('/api/plano-setorial-subtema').query({ pdm_id: psPdm.id });
            assert.ok(ps.body.linhas.some((l: { id: number }) => l.id === criado.body.id));

            const legado = await api(gestor).get('/api/subtema').query({ pdm_id: psPdm.id });
            assert.deepEqual(legado.body.linhas, []);
        });

        it('403 sem CadastroSubTemaPS.* / sem perfil de PS, 400 com sistema inválido', async () => {
            const psPdm = await criarPlanoSetorial();
            assertStatus(
                await api(semPrivilegio)
                    .post('/api/plano-setorial-subtema')
                    .send(nova({ pdm_id: psPdm.id })),
                403
            );

            const soSubtema = await criarPessoaComPrivilegios(['CadastroSubTemaPS.inserir']);
            assertStatus(
                await api(soSubtema)
                    .post('/api/plano-setorial-subtema')
                    .send(nova({ pdm_id: psPdm.id })),
                403
            );

            const admin = await loginAsSuperAdmin();
            assertStatus(await api(admin, { sistema: 'Projetos' }).get('/api/plano-setorial-subtema'), 400);
        });
    });
});
