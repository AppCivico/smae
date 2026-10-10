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

async function criarVariavel(fonte_id: number) {
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
            fonte_id,
        },
    });
}

describe('fonte-variavel', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'FonteVariavel.inserir',
            'FonteVariavel.editar',
            'FonteVariavel.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/fonte-variavel'), 401);
            assertStatus(await api().get('/api/fonte-variavel/1'), 401);
            assertStatus(await api().post('/api/fonte-variavel').send({ nome: uniq() }), 401);
            assertStatus(await api().patch('/api/fonte-variavel/1').send({ nome: uniq() }), 401);
            assertStatus(await api().delete('/api/fonte-variavel/1'), 401);
        });

        it('403 sem FonteVariavel.*, a leitura só exige sessão', async () => {
            const criado = await api(gestor)
                .post('/api/fonte-variavel')
                .send({ nome: uniq('Fonte') });
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(await api(semPrivilegio).get('/api/fonte-variavel'), 200);
            assertStatus(await api(semPrivilegio).post('/api/fonte-variavel').send({ nome: uniq() }), 403);
            assertStatus(await api(semPrivilegio).patch(`/api/fonte-variavel/${id}`).send({ nome: uniq() }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/fonte-variavel/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem nome ou com nome que não é texto', async () => {
            assertStatus(await api(gestor).post('/api/fonte-variavel').send({}), 400);
            assertStatus(await api(gestor).post('/api/fonte-variavel').send({ nome: 42 }), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lê, filtra por id, edita e remove', async () => {
            const nome = uniq('Pesquisa Domiciliar');
            const criado = await api(gestor).post('/api/fonte-variavel').send({ nome });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/fonte-variavel/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.nome, nome);

            const filtrada = await api(gestor).get('/api/fonte-variavel').query({ id });
            assert.deepEqual(
                filtrada.body.linhas.map((l: { id: number }) => l.id),
                [id]
            );

            const nova = uniq('Censo');
            assertStatus(await api(gestor).patch(`/api/fonte-variavel/${id}`).send({ nome: nova }), 200);
            assert.equal((await api(gestor).get(`/api/fonte-variavel/${id}`)).body.nome, nova);

            assertStatus(await api(gestor).delete(`/api/fonte-variavel/${id}`), 202);
            assertStatus(await api(gestor).get(`/api/fonte-variavel/${id}`), 404);
            const lista = await api(gestor).get('/api/fonte-variavel');
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/fonte-variavel/999999').send({ nome: uniq() }), 404);
        });
    });

    describe('unicidade e uso em variáveis', () => {
        it('400 com nome igual ao de outro registro ativo, ignorando maiúsculas', async () => {
            const nome = uniq('Sistema');
            assertStatus(await api(gestor).post('/api/fonte-variavel').send({ nome }), 201);

            const dup = await api(gestor).post('/api/fonte-variavel').send({ nome: nome.toUpperCase() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Nome igual ou semelhante/);
        });

        it('edição mantendo o próprio nome é aceita, e o nome de outro registro é recusado', async () => {
            const nome = uniq('Original');
            const a = await api(gestor).post('/api/fonte-variavel').send({ nome });
            assertStatus(a, 201);
            assertStatus(await api(gestor).patch(`/api/fonte-variavel/${a.body.id}`).send({ nome }), 200);

            const b = await api(gestor)
                .post('/api/fonte-variavel')
                .send({ nome: uniq('Outra') });
            assertStatus(b, 201);
            const res = await api(gestor).patch(`/api/fonte-variavel/${b.body.id}`).send({ nome });
            assertStatus(res, 400);
        });

        it('400 ao remover fonte usada por variável ativa, liberada depois que a variável é removida', async () => {
            const criado = await api(gestor)
                .post('/api/fonte-variavel')
                .send({ nome: uniq('Usada') });
            assertStatus(criado, 201);
            const variavel = await criarVariavel(criado.body.id);

            const emUso = await api(gestor).delete(`/api/fonte-variavel/${criado.body.id}`);
            assertStatus(emUso, 400);
            assert.ok(emUso.body.message.includes(`Registro em uso em variáveis: ${variavel.titulo}`));

            await prisma().variavel.update({ where: { id: variavel.id }, data: { removido_em: new Date() } });
            assertStatus(await api(gestor).delete(`/api/fonte-variavel/${criado.body.id}`), 202);
        });
    });
});
