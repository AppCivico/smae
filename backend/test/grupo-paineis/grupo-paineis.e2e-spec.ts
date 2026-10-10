import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('grupo-paineis (módulo PDM)', () => {
    let gestor: Sessao;
    let soPessoa: Sessao;
    let soVisualizar: Sessao;
    let semPrivilegio: Sessao;

    const como = (s: Sessao) => api(s, { sistema: 'PDM' });
    const porId = (linhas: any[], id: number) => linhas.find((l) => l.id === id);
    const novoGrupo = (extra: Record<string, unknown> = {}) => ({ nome: uniq('Grupo'), ativo: true, ...extra });

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroGrupoPaineis.inserir',
            'CadastroGrupoPaineis.editar',
            'CadastroGrupoPaineis.remover',
            'CadastroPainel.inserir',
        ]);
        soPessoa = await criarPessoaComPrivilegios(['CadastroPessoa.inserir']);
        soVisualizar = await criarPessoaComPrivilegios(['CadastroPainel.visualizar']);
        semPrivilegio = await criarPessoaSemPrivilegios();

        if (!(await prisma().pdm.findFirst({ where: { ativo: true } }))) {
            const pdm = await criarPdmAntigo();
            await prisma().pdm.update({ where: { id: pdm.id }, data: { ativo: true } });
        }
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/grupo-paineis'), 401);
            assertStatus(await api().post('/api/grupo-paineis').send(novoGrupo()), 401);
        });

        it('403 sem privilégio em todas as rotas', async () => {
            const criado = await como(gestor).post('/api/grupo-paineis').send(novoGrupo());
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const post = await como(semPrivilegio).post('/api/grupo-paineis').send(novoGrupo());
            assertStatus(post, 403);
            assert.match(post.body.message, /CadastroGrupoPaineis\.inserir/);

            const patch = await como(semPrivilegio).patch(`/api/grupo-paineis/${id}`).send({ nome: uniq() });
            assertStatus(patch, 403);
            assert.match(patch.body.message, /CadastroGrupoPaineis\.editar/);

            const del = await como(semPrivilegio).delete(`/api/grupo-paineis/${id}`);
            assertStatus(del, 403);
            assert.match(del.body.message, /CadastroGrupoPaineis\.remover/);

            assertStatus(await como(semPrivilegio).get('/api/grupo-paineis'), 403);
            assertStatus(await como(semPrivilegio).get(`/api/grupo-paineis/${id}`), 403);
        });

        it('leitura sem escrita: CadastroPessoa.inserir lista, CadastroPainel.visualizar vê o detalhe', async () => {
            const criado = await como(gestor).post('/api/grupo-paineis').send(novoGrupo());
            const id: number = criado.body.id;

            assertStatus(await como(soPessoa).get('/api/grupo-paineis'), 200);
            assertStatus(await como(soPessoa).post('/api/grupo-paineis').send(novoGrupo()), 403);

            assertStatus(await como(soVisualizar).get(`/api/grupo-paineis/${id}`), 200);
            assertStatus(await como(soVisualizar).get('/api/grupo-paineis'), 403);
            assertStatus(await como(soVisualizar).patch(`/api/grupo-paineis/${id}`).send({ ativo: false }), 403);
        });

        it('CadastroGrupoPaineis pertence ao sistema PDM: com header Projetos a escrita dá 403', async () => {
            const pessoa = await criarPessoaComPrivilegios(['CadastroGrupoPaineis.inserir', 'CadastroOrgao.inserir']);

            const fora = await api(pessoa, { sistema: 'Projetos' }).post('/api/grupo-paineis').send(novoGrupo());
            assertStatus(fora, 403);
            assert.match(fora.body.message, /CadastroGrupoPaineis\.inserir/);

            assertStatus(await api(pessoa, { sistema: 'PDM' }).post('/api/grupo-paineis').send(novoGrupo()), 201);
        });
    });

    describe('validação', () => {
        it('400 sem nome, com nome não textual ou com ativo não booleano', async () => {
            assertStatus(await como(gestor).post('/api/grupo-paineis').send({ ativo: true }), 400);
            assertStatus(
                await como(gestor)
                    .post('/api/grupo-paineis')
                    .send(novoGrupo({ nome: 123 })),
                400
            );
            assertStatus(
                await como(gestor)
                    .post('/api/grupo-paineis')
                    .send(novoGrupo({ ativo: 'sim' })),
                400
            );
            assertStatus(await como(gestor).post('/api/grupo-paineis').send({ nome: uniq() }), 400);
        });

        it('400 com nome acima do limite e com :id não numérico', async () => {
            const longo = await como(gestor)
                .post('/api/grupo-paineis')
                .send(novoGrupo({ nome: 'x'.repeat(5000) }));
            assertStatus(longo, 400);
            assertStatus(await como(gestor).patch('/api/grupo-paineis/abc').send({ ativo: false }), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lista, lê o detalhe, edita e remove', async () => {
            const dados = novoGrupo();
            const criado = await como(gestor).post('/api/grupo-paineis').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;
            assert.equal(typeof id, 'number');
            assert.equal(criado.body.nome, dados.nome);

            const lista = await como(gestor).get('/api/grupo-paineis');
            assertStatus(lista, 200);
            assert.deepEqual(porId(lista.body.linhas, id), {
                id,
                nome: dados.nome,
                ativo: true,
                painel_count: 0,
                pessoa_count: 0,
                paineis: [],
                pessoas: [],
            });

            const detalhe = await como(gestor).get(`/api/grupo-paineis/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.nome, dados.nome);
            assert.equal(detalhe.body.painel_count, 0);

            const novoNome = uniq('Renomeado');
            const edicao = await como(gestor).patch(`/api/grupo-paineis/${id}`).send({ nome: novoNome, ativo: false });
            assertStatus(edicao, 200);
            assert.equal(edicao.body.id, id);
            const editado = (await como(gestor).get(`/api/grupo-paineis/${id}`)).body;
            assert.equal(editado.nome, novoNome);
            assert.equal(editado.ativo, false);

            assertStatus(await como(gestor).delete(`/api/grupo-paineis/${id}`), 202);
            const removido = await prisma().grupoPainel.findUniqueOrThrow({ where: { id } });
            assert.ok(removido.removido_em);
            assert.equal(removido.removido_por, gestor.pessoa.id);
            const depois = await como(gestor).get('/api/grupo-paineis');
            assert.equal(porId(depois.body.linhas, id), undefined);
        });

        it('filtra a listagem por ativo', async () => {
            const ativo = await como(gestor)
                .post('/api/grupo-paineis')
                .send(novoGrupo({ ativo: true }));
            const inativo = await como(gestor)
                .post('/api/grupo-paineis')
                .send(novoGrupo({ ativo: false }));
            assertStatus(ativo, 201);
            assertStatus(inativo, 201);

            const soAtivos = (await como(gestor).get('/api/grupo-paineis?ativo=true')).body.linhas;
            assert.ok(porId(soAtivos, ativo.body.id));
            assert.equal(porId(soAtivos, inativo.body.id), undefined);

            const soInativos = (await como(gestor).get('/api/grupo-paineis?ativo=false')).body.linhas;
            assert.ok(porId(soInativos, inativo.body.id));
            assert.equal(porId(soInativos, ativo.body.id), undefined);

            const todos = (await como(gestor).get('/api/grupo-paineis')).body.linhas;
            assert.ok(porId(todos, ativo.body.id));
            assert.ok(porId(todos, inativo.body.id));
        });

        it('painel criado com o grupo aparece no detalhe e na contagem', async () => {
            const grupo = await como(gestor).post('/api/grupo-paineis').send(novoGrupo());
            assertStatus(grupo, 201);
            const nomePainel = uniq('Painel');
            const painel = await como(gestor)
                .post('/api/painel')
                .send({
                    nome: nomePainel,
                    periodicidade: 'Mensal',
                    mostrar_planejado_por_padrao: true,
                    mostrar_acumulado_por_padrao: true,
                    mostrar_indicador_por_padrao: true,
                    ativo: true,
                    grupos: [grupo.body.id],
                });
            assertStatus(painel, 201);

            const detalhe = (await como(gestor).get(`/api/grupo-paineis/${grupo.body.id}`)).body;
            assert.equal(detalhe.painel_count, 1);
            assert.deepEqual(detalhe.paineis, [{ id: painel.body.id, nome: nomePainel, ativo: true }]);

            const naLista = porId((await como(gestor).get('/api/grupo-paineis')).body.linhas, grupo.body.id);
            assert.equal(naLista.painel_count, 1);
        });
    });

    describe('regras de negócio', () => {
        it('400 com nome duplicado, ignorando maiúsculas, na criação e na edição', async () => {
            const nome = uniq('Duplicado');
            assertStatus(await como(gestor).post('/api/grupo-paineis').send(novoGrupo({ nome })), 201);

            const dup = await como(gestor)
                .post('/api/grupo-paineis')
                .send(novoGrupo({ nome: nome.toUpperCase() }));
            assertStatus(dup, 400);
            assert.match(dup.body.message, /igual ou semelhante/);

            const outro = await como(gestor).post('/api/grupo-paineis').send(novoGrupo());
            assertStatus(await como(gestor).patch(`/api/grupo-paineis/${outro.body.id}`).send({ nome }), 400);
        });

        it(
            'edita só o ativo sem reenviar o nome',
            async () => {
                await como(gestor).post('/api/grupo-paineis').send(novoGrupo());
                const grupo = await como(gestor)
                    .post('/api/grupo-paineis')
                    .send(novoGrupo({ ativo: true }));
                assertStatus(grupo, 201);

                const res = await como(gestor).patch(`/api/grupo-paineis/${grupo.body.id}`).send({ ativo: false });
                assertStatus(res, 200);
                const depois = await prisma().grupoPainel.findUniqueOrThrow({ where: { id: grupo.body.id } });
                assert.equal(depois.ativo, false);
            }
        );
    });
});
