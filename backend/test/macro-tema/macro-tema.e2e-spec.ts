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

describe('macro-tema', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let semPdm: Sessao;
    let pdmId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroMacroTema.inserir',
            'CadastroMacroTema.editar',
            'CadastroMacroTema.remover',
            'CadastroPdm.editar',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        semPdm = await criarPessoaComPrivilegios([
            'CadastroMacroTema.inserir',
            'CadastroMacroTema.editar',
            'CadastroMacroTema.remover',
        ]);
        pdmId = (await criarPdmAntigo()).id;
    });

    const nova = (extra: Record<string, unknown> = {}) => ({ descricao: uniq('Macro Tema'), pdm_id: pdmId, ...extra });

    describe('/api/macrotema (PDM antigo)', () => {
        describe('autenticação e privilégios', () => {
            it('401 sem token', async () => {
                assertStatus(await api().get('/api/macrotema'), 401);
                assertStatus(await api().post('/api/macrotema').send(nova()), 401);
                assertStatus(await api().delete('/api/macrotema/1'), 401);
            });

            it('403 sem CadastroMacroTema.* e 403 sem CadastroPdm.editar', async () => {
                assertStatus(await api(semPrivilegio).post('/api/macrotema').send(nova()), 403);
                assertStatus(await api(semPdm).post('/api/macrotema').send(nova()), 403);
            });
        });

        describe('validação', () => {
            it('400 sem descricao ou sem pdm_id', async () => {
                assertStatus(await api(gestor).post('/api/macrotema').send({ pdm_id: pdmId }), 400);
                assertStatus(await api(gestor).post('/api/macrotema').send({ descricao: uniq() }), 400);
            });

            it('400 com pdm_id inexistente', async () => {
                const res = await api(gestor)
                    .post('/api/macrotema')
                    .send(nova({ pdm_id: 999999 }));
                assertStatus(res, 400);
                assert.match(res.body.message, /não encontrado ou removido/);
            });
        });

        describe('CRUD', () => {
            it('cria, lê, lista por pdm, edita e remove', async () => {
                const descricao = uniq('Cidade inclusiva');
                const criado = await api(gestor).post('/api/macrotema').send(nova({ descricao }));
                assertStatus(criado, 201);
                const id: number = criado.body.id;

                const lido = await api(gestor).get(`/api/macrotema/${id}`);
                assertStatus(lido, 200);
                assert.deepEqual(lido.body, { id, descricao, pdm_id: pdmId });

                const lista = await api(gestor).get('/api/macrotema').query({ pdm_id: pdmId });
                assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === id));

                const nova2 = uniq('Cidade sustentável');
                assertStatus(await api(gestor).patch(`/api/macrotema/${id}`).send({ descricao: nova2 }), 200);
                assert.equal((await api(gestor).get(`/api/macrotema/${id}`)).body.descricao, nova2);

                assertStatus(await api(gestor).delete(`/api/macrotema/${id}`), 202);
                assertStatus(await api(gestor).get(`/api/macrotema/${id}`), 404);
            });
        });

        describe('unicidade por PDM e uso em metas', () => {
            it('400 com descrição igual no mesmo PDM, aceita em outro PDM', async () => {
                const descricao = uniq('Economia');
                assertStatus(await api(gestor).post('/api/macrotema').send(nova({ descricao })), 201);

                const dup = await api(gestor)
                    .post('/api/macrotema')
                    .send(nova({ descricao: descricao.toUpperCase() }));
                assertStatus(dup, 400);
                assert.match(dup.body.message, /Já existe um Macro Tema com esta descrição/);

                const outroPdm = (await criarPdmAntigo()).id;
                assertStatus(
                    await api(gestor)
                        .post('/api/macrotema')
                        .send(nova({ descricao, pdm_id: outroPdm })),
                    201
                );
            });

            it('400 ao remover macro tema usado em meta, liberado depois que a meta é removida', async () => {
                const criado = await api(gestor).post('/api/macrotema').send(nova());
                assertStatus(criado, 201);
                const meta = await criarMeta(pdmId, { macro_tema_id: criado.body.id });

                const emUso = await api(gestor).delete(`/api/macrotema/${criado.body.id}`);
                assertStatus(emUso, 400);
                assert.match(emUso.body.message, /Eixo em uso em Metas/);

                await prisma().meta.update({ where: { id: meta.id }, data: { removido_em: new Date() } });
                assertStatus(await api(gestor).delete(`/api/macrotema/${criado.body.id}`), 202);
            });
        });
    });

    describe('/api/plano-setorial-macrotema (PS)', () => {
        it('cria e lista no PS, e não aparece na listagem do PDM antigo', async () => {
            const psPdm = await criarPlanoSetorial();
            const admin = await loginAsSuperAdmin();
            const criado = await api(admin)
                .post('/api/plano-setorial-macrotema')
                .send(nova({ pdm_id: psPdm.id }));
            assertStatus(criado, 201);

            const ps = await api(admin).get('/api/plano-setorial-macrotema').query({ pdm_id: psPdm.id });
            assert.ok(ps.body.linhas.some((l: { id: number }) => l.id === criado.body.id));

            const legado = await api(gestor).get('/api/macrotema').query({ pdm_id: psPdm.id });
            assert.deepEqual(legado.body.linhas, []);
        });

        it('403 sem CadastroMacroTemaPS.* / sem perfil de PS, 400 com sistema inválido', async () => {
            const psPdm = await criarPlanoSetorial();
            assertStatus(
                await api(semPrivilegio)
                    .post('/api/plano-setorial-macrotema')
                    .send(nova({ pdm_id: psPdm.id })),
                403
            );

            const soMacro = await criarPessoaComPrivilegios(['CadastroMacroTemaPS.inserir']);
            assertStatus(
                await api(soMacro)
                    .post('/api/plano-setorial-macrotema')
                    .send(nova({ pdm_id: psPdm.id })),
                403
            );

            const admin = await loginAsSuperAdmin();
            assertStatus(await api(admin, { sistema: 'Projetos' }).get('/api/plano-setorial-macrotema'), 400);
        });
    });
});
