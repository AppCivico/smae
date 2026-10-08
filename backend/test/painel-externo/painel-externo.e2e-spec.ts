import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('painel-externo (exige smae-sistemas nas escritas)', () => {
    let gestor: Sessao;
    let soInserir: Sessao;
    let semPrivilegio: Sessao;

    const como = (s: Sessao) => api(s, { sistema: 'PDM' });
    const porId = (linhas: any[], id: number) => linhas.find((l) => l.id === id);

    const novoPainel = (extra: Record<string, unknown> = {}) => ({
        titulo: uniq('Painel externo'),
        descricao: 'Painel de testes',
        link: 'https://painel.e2e.test/dashboard?id=1',
        ...extra,
    });

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroPainelExterno.inserir',
            'CadastroPainelExterno.editar',
            'CadastroPainelExterno.remover',
            'CadastroGrupoPainelExterno.administrador',
        ]);
        soInserir = await criarPessoaComPrivilegios(['CadastroPainelExterno.inserir']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/painel-externo'), 401);
            assertStatus(await api().post('/api/painel-externo').send(novoPainel()), 401);
        });

        it('403 sem CadastroPainelExterno.inserir / editar / remover', async () => {
            const criado = await como(gestor).post('/api/painel-externo').send(novoPainel());
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const post = await como(semPrivilegio).post('/api/painel-externo').send(novoPainel());
            assertStatus(post, 403);
            assert.match(post.body.message, /CadastroPainelExterno\.inserir/);

            const get = await como(semPrivilegio).get('/api/painel-externo');
            assertStatus(get, 403);

            const patch = await como(semPrivilegio).patch(`/api/painel-externo/${id}`).send({ titulo: uniq() });
            assertStatus(patch, 403);
            assert.match(patch.body.message, /CadastroPainelExterno\.editar/);

            const del = await como(semPrivilegio).delete(`/api/painel-externo/${id}`);
            assertStatus(del, 403);
            assert.match(del.body.message, /CadastroPainelExterno\.remover/);
        });

        it('com só inserir lê (200) mas não edita nem remove (403)', async () => {
            const criado = await como(soInserir).post('/api/painel-externo').send(novoPainel());
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            assertStatus(await como(soInserir).get(`/api/painel-externo/${id}`), 200);
            assertStatus(await como(soInserir).patch(`/api/painel-externo/${id}`).send({ titulo: uniq() }), 403);
            assertStatus(await como(soInserir).delete(`/api/painel-externo/${id}`), 403);
        });

        it('400 ao escrever sem o header smae-sistemas', async () => {
            const res = await api(gestor).post('/api/painel-externo').send(novoPainel());
            assertStatus(res, 400);
            assert.match(res.body.message, /mais de um sistema/);
        });
    });

    describe('validação', () => {
        it('400 sem titulo ou com link inválido', async () => {
            const { titulo: _titulo, ...semTitulo } = novoPainel();
            assertStatus(await como(gestor).post('/api/painel-externo').send(semTitulo), 400);

            for (const link of ['http://painel.e2e.test/x', 'https://localhost', 'painel.e2e.test', 123]) {
                const res = await como(gestor).post('/api/painel-externo').send(novoPainel({ link }));
                assertStatus(res, 400);
            }
        });

        it('400 com grupos fora do formato', async () => {
            assertStatus(
                await como(gestor)
                    .post('/api/painel-externo')
                    .send(novoPainel({ grupos: ['a'] })),
                400
            );
            assertStatus(
                await como(gestor)
                    .post('/api/painel-externo')
                    .send(novoPainel({ grupos: 'x' })),
                400
            );
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await como(gestor).get('/api/painel-externo/abc'), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lê por id, lista, edita e remove', async () => {
            const dados = novoPainel();
            const criado = await como(gestor).post('/api/painel-externo').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;
            assert.equal(typeof id, 'number');

            const detalhe = await como(gestor).get(`/api/painel-externo/${id}`);
            assertStatus(detalhe, 200);
            assert.deepEqual(detalhe.body, {
                id,
                titulo: dados.titulo,
                descricao: dados.descricao,
                link: dados.link,
                grupos: [],
            });

            const noBanco = await prisma().painelExterno.findUniqueOrThrow({ where: { id } });
            assert.equal(noBanco.link_dominio, 'painel.e2e.test');
            assert.equal(noBanco.modulo_sistema, 'PDM');
            assert.equal(noBanco.criado_por, gestor.pessoa.id);

            const lista = await como(gestor).get('/api/painel-externo');
            assertStatus(lista, 200);
            assert.equal(porId(lista.body.linhas, id)?.titulo, dados.titulo);

            const novoTitulo = uniq('Renomeado');
            const novoLink = 'https://outro.e2e.test/painel';
            assertStatus(
                await como(gestor).patch(`/api/painel-externo/${id}`).send({ titulo: novoTitulo, link: novoLink }),
                200
            );
            const editado = await como(gestor).get(`/api/painel-externo/${id}`);
            assert.equal(editado.body.titulo, novoTitulo);
            assert.equal(editado.body.link, novoLink);
            assert.equal(editado.body.descricao, dados.descricao);
            const aposEditar = await prisma().painelExterno.findUniqueOrThrow({ where: { id } });
            assert.equal(aposEditar.link_dominio, 'outro.e2e.test');
            assert.equal(aposEditar.atualizado_por, gestor.pessoa.id);

            assertStatus(await como(gestor).delete(`/api/painel-externo/${id}`), 202);
            const removido = await prisma().painelExterno.findUniqueOrThrow({ where: { id } });
            assert.ok(removido.removido_em);
            assert.equal(removido.removido_por, gestor.pessoa.id);
            assertStatus(await como(gestor).get(`/api/painel-externo/${id}`), 404);
            const depois = await como(gestor).get('/api/painel-externo');
            assert.equal(porId(depois.body.linhas, id), undefined);
        });

        it('400 com título duplicado, ignorando maiúsculas', async () => {
            const titulo = uniq('Duplicado');
            assertStatus(await como(gestor).post('/api/painel-externo').send(novoPainel({ titulo })), 201);

            const res = await como(gestor)
                .post('/api/painel-externo')
                .send(novoPainel({ titulo: titulo.toUpperCase() }));
            assertStatus(res, 400);
            assert.match(res.body.message, /igual ou semelhante/);

            const outro = await como(gestor).post('/api/painel-externo').send(novoPainel());
            const edicao = await como(gestor).patch(`/api/painel-externo/${outro.body.id}`).send({ titulo });
            assertStatus(edicao, 400);
        });

        it('vincula e desvincula grupos pelo PATCH e some do grupo ao remover o painel', async () => {
            const grupo = await como(gestor)
                .post('/api/grupo-painel-externo')
                .send({ titulo: uniq('Grupo'), orgao_id: 1, participantes: [] });
            assertStatus(grupo, 201);
            const grupoId: number = grupo.body.id;

            const criado = await como(gestor)
                .post('/api/painel-externo')
                .send(novoPainel({ grupos: [grupoId] }));
            assertStatus(criado, 201);
            const id: number = criado.body.id;
            assert.deepEqual((await como(gestor).get(`/api/painel-externo/${id}`)).body.grupos, [grupoId]);

            const uso = await como(gestor).get('/api/grupo-painel-externo?retornar_uso=true');
            assertStatus(uso, 200);
            const linhaGrupo = porId(uso.body.linhas, grupoId);
            assert.deepEqual(
                linhaGrupo.paineis.map((p: { id: number }) => p.id),
                [id]
            );

            assertStatus(await como(gestor).patch(`/api/painel-externo/${id}`).send({ grupos: [] }), 200);
            assert.deepEqual((await como(gestor).get(`/api/painel-externo/${id}`)).body.grupos, []);

            assertStatus(
                await como(gestor)
                    .patch(`/api/painel-externo/${id}`)
                    .send({ grupos: [grupoId] }),
                200
            );
            assertStatus(await como(gestor).delete(`/api/painel-externo/${id}`), 202);
            const usoDepois = await como(gestor).get('/api/grupo-painel-externo?retornar_uso=true');
            assert.deepEqual(porId(usoDepois.body.linhas, grupoId).paineis, []);
        });

        it('404 ao editar painel inexistente e ao vincular grupo inexistente', async () => {
            assertStatus(await como(gestor).patch('/api/painel-externo/999999').send({ titulo: uniq() }), 404);

            const dados = novoPainel({ grupos: [999999] });
            assertStatus(await como(gestor).post('/api/painel-externo').send(dados), 404);
            const vazou = await prisma().painelExterno.count({ where: { titulo: dados.titulo } });
            assert.equal(vazou, 0);
        });
    });
});
