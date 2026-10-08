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

async function criarCategoria(criado_por: number) {
    return prisma().categoriaAssuntoVariavel.create({ data: { nome: uniq('Categoria'), criado_por } });
}

async function criarVariavel() {
    const unidade = await prisma().unidadeMedida.create({
        data: { sigla: uniq('un').slice(0, 15), descricao: uniq('unidade') },
    });
    return prisma().variavel.create({
        data: {
            orgao_id: 1,
            titulo: uniq('Variável'),
            codigo: uniq('cod').replace(/\s+/g, '-'),
            valor_base: 0,
            periodicidade: 'Mensal',
            unidade_medida_id: unidade.id,
        },
    });
}

describe('assunto-variavel', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let categoriaId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'AssuntoVariavel.inserir',
            'AssuntoVariavel.editar',
            'AssuntoVariavel.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        categoriaId = (await criarCategoria(gestor.pessoa.id)).id;
    });

    const novo = (extra: Record<string, unknown> = {}) => ({
        nome: uniq('Assunto'),
        categoria_assunto_variavel_id: categoriaId,
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/assunto-variavel'), 401);
            assertStatus(await api().post('/api/assunto-variavel').send(novo()), 401);
            assertStatus(await api().patch('/api/assunto-variavel/1').send(novo()), 401);
            assertStatus(await api().delete('/api/assunto-variavel/1'), 401);
        });

        it('403 sem AssuntoVariavel.*, a leitura só exige sessão', async () => {
            const criado = await api(gestor).post('/api/assunto-variavel').send(novo());
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(await api(semPrivilegio).get('/api/assunto-variavel'), 200);
            assertStatus(await api(semPrivilegio).post('/api/assunto-variavel').send(novo()), 403);
            assertStatus(await api(semPrivilegio).patch(`/api/assunto-variavel/${id}`).send(novo()), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/assunto-variavel/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem nome, sem categoria ou com categoria que não é número', async () => {
            assertStatus(
                await api(gestor).post('/api/assunto-variavel').send({ categoria_assunto_variavel_id: categoriaId }),
                400
            );
            assertStatus(await api(gestor).post('/api/assunto-variavel').send({ nome: uniq() }), 400);
            assertStatus(
                await api(gestor)
                    .post('/api/assunto-variavel')
                    .send(novo({ categoria_assunto_variavel_id: 'x' })),
                400
            );
        });

        it('400 com categoria inexistente ou removida', async () => {
            const res = await api(gestor)
                .post('/api/assunto-variavel')
                .send(novo({ categoria_assunto_variavel_id: 999999 }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Categoria de assunto não encontrada/);

            const removida = await criarCategoria(gestor.pessoa.id);
            await prisma().categoriaAssuntoVariavel.update({
                where: { id: removida.id },
                data: { removido_em: new Date() },
            });
            assertStatus(
                await api(gestor)
                    .post('/api/assunto-variavel')
                    .send(novo({ categoria_assunto_variavel_id: removida.id })),
                400
            );
        });
    });

    describe('CRUD', () => {
        it('cria, lê com a categoria aninhada, edita e remove', async () => {
            const nome = uniq('Pobreza');
            const criado = await api(gestor).post('/api/assunto-variavel').send(novo({ nome }));
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/assunto-variavel/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.nome, nome);
            assert.equal(lido.body.categoria_assunto_variavel.id, categoriaId);

            const filtrado = await api(gestor).get('/api/assunto-variavel').query({ id });
            assert.deepEqual(
                filtrado.body.linhas.map((l: { id: number }) => l.id),
                [id]
            );

            const novoNome = uniq('Desemprego');
            assertStatus(
                await api(gestor)
                    .patch(`/api/assunto-variavel/${id}`)
                    .send(novo({ nome: novoNome })),
                200
            );
            assert.equal((await api(gestor).get(`/api/assunto-variavel/${id}`)).body.nome, novoNome);

            assertStatus(await api(gestor).delete(`/api/assunto-variavel/${id}`), 202);
            assertStatus(await api(gestor).get(`/api/assunto-variavel/${id}`), 404);
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/assunto-variavel/999999').send(novo()), 404);
        });
    });

    describe('unicidade e uso em variáveis', () => {
        it('400 com nome igual de outro registro ativo, ignorando maiúsculas', async () => {
            const nome = uniq('Saúde');
            assertStatus(await api(gestor).post('/api/assunto-variavel').send(novo({ nome })), 201);

            const dup = await api(gestor)
                .post('/api/assunto-variavel')
                .send(novo({ nome: nome.toUpperCase() }));
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Nome igual ou semelhante/);
        });

        it('400 ao editar para o nome de outro assunto; o próprio nome é aceito', async () => {
            const nome = uniq('Educação');
            const a = await api(gestor).post('/api/assunto-variavel').send(novo({ nome }));
            assertStatus(a, 201);
            assertStatus(await api(gestor).patch(`/api/assunto-variavel/${a.body.id}`).send(novo({ nome })), 200);

            const b = await api(gestor).post('/api/assunto-variavel').send(novo());
            assertStatus(b, 201);
            assertStatus(await api(gestor).patch(`/api/assunto-variavel/${b.body.id}`).send(novo({ nome })), 400);
        });

        it('400 ao remover assunto usado por variável ativa, liberado depois que a variável é removida', async () => {
            const criado = await api(gestor).post('/api/assunto-variavel').send(novo());
            assertStatus(criado, 201);
            const variavel = await criarVariavel();
            await prisma().variavelAssuntoVariavel.create({
                data: { variavel_id: variavel.id, assunto_variavel_id: criado.body.id },
            });

            const emUso = await api(gestor).delete(`/api/assunto-variavel/${criado.body.id}`);
            assertStatus(emUso, 400);
            assert.ok(emUso.body.message.includes(variavel.titulo));

            await prisma().variavel.update({ where: { id: variavel.id }, data: { removido_em: new Date() } });
            assertStatus(await api(gestor).delete(`/api/assunto-variavel/${criado.body.id}`), 202);
        });
    });
});
