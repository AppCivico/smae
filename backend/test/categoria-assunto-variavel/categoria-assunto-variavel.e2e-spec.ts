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

describe('categoria-assunto-variavel', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'AssuntoVariavel.inserir',
            'AssuntoVariavel.editar',
            'AssuntoVariavel.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/categoria-assunto-variavel'), 401);
            assertStatus(await api().post('/api/categoria-assunto-variavel').send({ nome: uniq() }), 401);
            assertStatus(await api().patch('/api/categoria-assunto-variavel/1').send({ nome: uniq() }), 401);
            assertStatus(await api().delete('/api/categoria-assunto-variavel/1'), 401);
        });

        it('403 sem AssuntoVariavel.*, a leitura só exige sessão', async () => {
            const criado = await api(gestor)
                .post('/api/categoria-assunto-variavel')
                .send({ nome: uniq('Categoria') });
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(await api(semPrivilegio).get('/api/categoria-assunto-variavel'), 200);
            assertStatus(await api(semPrivilegio).post('/api/categoria-assunto-variavel').send({ nome: uniq() }), 403);
            assertStatus(
                await api(semPrivilegio).patch(`/api/categoria-assunto-variavel/${id}`).send({ nome: uniq() }),
                403
            );
            assertStatus(await api(semPrivilegio).delete(`/api/categoria-assunto-variavel/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem nome ou com nome que não é texto', async () => {
            assertStatus(await api(gestor).post('/api/categoria-assunto-variavel').send({}), 400);
            assertStatus(await api(gestor).post('/api/categoria-assunto-variavel').send({ nome: 7 }), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lista, lê, edita e remove', async () => {
            const nome = uniq('Políticas');
            const criado = await api(gestor).post('/api/categoria-assunto-variavel').send({ nome });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/categoria-assunto-variavel/${id}`);
            assertStatus(lido, 200);
            assert.deepEqual(lido.body, { id, nome, assunto_variavel: [] });

            const novoNome = uniq('Políticas Públicas');
            assertStatus(
                await api(gestor).patch(`/api/categoria-assunto-variavel/${id}`).send({ nome: novoNome }),
                200
            );
            assert.equal((await api(gestor).get(`/api/categoria-assunto-variavel/${id}`)).body.nome, novoNome);

            assertStatus(await api(gestor).delete(`/api/categoria-assunto-variavel/${id}`), 202);
            assertStatus(await api(gestor).get(`/api/categoria-assunto-variavel/${id}`), 404);
            const lista = await api(gestor).get('/api/categoria-assunto-variavel');
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/categoria-assunto-variavel/999999').send({ nome: uniq() }), 404);
        });
    });

    describe('unicidade e assuntos dependentes', () => {
        it('400 com nome igual de outra categoria ativa, ignorando maiúsculas', async () => {
            const nome = uniq('Ambiente');
            assertStatus(await api(gestor).post('/api/categoria-assunto-variavel').send({ nome }), 201);

            const dup = await api(gestor).post('/api/categoria-assunto-variavel').send({ nome: nome.toUpperCase() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Nome igual ou semelhante/);
        });

        it('400 ao remover categoria com assunto ativo; a lista aninhada mostra só assuntos ativos', async () => {
            const categoria = await api(gestor)
                .post('/api/categoria-assunto-variavel')
                .send({ nome: uniq('Com assunto') });
            assertStatus(categoria, 201);
            const categoriaId: number = categoria.body.id;

            const assunto = await api(gestor)
                .post('/api/assunto-variavel')
                .send({ nome: uniq('Assunto'), categoria_assunto_variavel_id: categoriaId });
            assertStatus(assunto, 201);

            const comAssunto = await api(gestor).get(`/api/categoria-assunto-variavel/${categoriaId}`);
            assert.deepEqual(
                comAssunto.body.assunto_variavel.map((a: { id: number }) => a.id),
                [assunto.body.id]
            );

            const emUso = await api(gestor).delete(`/api/categoria-assunto-variavel/${categoriaId}`);
            assertStatus(emUso, 400);
            assert.match(emUso.body.message, /Registro em uso nos assuntos/);

            assertStatus(await api(gestor).delete(`/api/assunto-variavel/${assunto.body.id}`), 202);
            const semAssunto = await api(gestor).get(`/api/categoria-assunto-variavel/${categoriaId}`);
            assert.deepEqual(semAssunto.body.assunto_variavel, []);
            assertStatus(await api(gestor).delete(`/api/categoria-assunto-variavel/${categoriaId}`), 202);
        });

        it('categoria removida no banco não aparece na listagem', async () => {
            const criada = await prisma().categoriaAssuntoVariavel.create({
                data: { nome: uniq('Soft'), criado_por: gestor.pessoa.id, removido_em: new Date() },
            });
            const lista = await api(gestor).get('/api/categoria-assunto-variavel');
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === criada.id),
                false
            );
        });
    });
});
