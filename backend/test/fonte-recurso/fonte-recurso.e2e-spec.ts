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

describe('fonte-recurso', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroFonteRecurso.inserir',
            'CadastroFonteRecurso.editar',
            'CadastroFonteRecurso.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/fonte-recurso'), 401);
            assertStatus(await api().post('/api/fonte-recurso').send({ fonte: uniq() }), 401);
            assertStatus(await api().patch('/api/fonte-recurso/1').send({ fonte: uniq() }), 401);
            assertStatus(await api().delete('/api/fonte-recurso/1'), 401);
        });

        it('403 sem CadastroFonteRecurso.*, a listagem só exige sessão', async () => {
            assertStatus(await api(semPrivilegio).get('/api/fonte-recurso'), 200);

            const criado = await api(gestor)
                .post('/api/fonte-recurso')
                .send({ fonte: uniq('Fonte') });
            assertStatus(criado, 201);
            assertStatus(await api(semPrivilegio).post('/api/fonte-recurso').send({ fonte: uniq() }), 403);
            assertStatus(
                await api(semPrivilegio).patch(`/api/fonte-recurso/${criado.body.id}`).send({ fonte: uniq() }),
                403
            );
            assertStatus(await api(semPrivilegio).delete(`/api/fonte-recurso/${criado.body.id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem fonte ou com fonte vazia', async () => {
            assertStatus(await api(gestor).post('/api/fonte-recurso').send({ sigla: 'TM' }), 400);
            assertStatus(await api(gestor).post('/api/fonte-recurso').send({ fonte: '' }), 400);
        });
    });

    describe('CRUD', () => {
        it('cria sem sigla, lista ordenado por fonte, edita e remove', async () => {
            const fonte = uniq('Recurso Próprio');
            const criado = await api(gestor).post('/api/fonte-recurso').send({ fonte });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lista = await api(gestor).get('/api/fonte-recurso');
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.deepEqual(linha, { id, fonte, sigla: null });

            const esperado = await prisma().fonteRecurso.findMany({
                where: { removido_em: null },
                orderBy: { fonte: 'asc' },
                select: { id: true },
            });
            assert.deepEqual(
                lista.body.linhas.map((l: { id: number }) => l.id),
                esperado.map((r) => r.id)
            );

            const nova = uniq('Convênio Federal');
            assertStatus(await api(gestor).patch(`/api/fonte-recurso/${id}`).send({ fonte: nova, sigla: 'CF' }), 200);
            const editada = (await api(gestor).get('/api/fonte-recurso')).body.linhas.find(
                (l: { id: number }) => l.id === id
            );
            assert.deepEqual(editada, { id, fonte: nova, sigla: 'CF' });

            assertStatus(await api(gestor).delete(`/api/fonte-recurso/${id}`), 202);
            const depois = await api(gestor).get('/api/fonte-recurso');
            assert.equal(
                depois.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/fonte-recurso/999999').send({ fonte: uniq() }), 404);
        });
    });

    describe('unicidade entre registros ativos', () => {
        it('400 com fonte igual, ignorando maiúsculas', async () => {
            const fonte = uniq('Tesouro');
            assertStatus(await api(gestor).post('/api/fonte-recurso').send({ fonte }), 201);

            const dup = await api(gestor).post('/api/fonte-recurso').send({ fonte: fonte.toUpperCase() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Fonte igual ou semelhante/);
        });

        it('400 com sigla igual ao criar e ao editar', async () => {
            const sigla = uniq('S').slice(0, 20);
            assertStatus(await api(gestor).post('/api/fonte-recurso').send({ fonte: uniq(), sigla }), 201);

            const dup = await api(gestor).post('/api/fonte-recurso').send({ fonte: uniq(), sigla });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Sigla igual ou semelhante/);

            const outra = await api(gestor).post('/api/fonte-recurso').send({ fonte: uniq() });
            assertStatus(outra, 201);
            const editada = await api(gestor).patch(`/api/fonte-recurso/${outra.body.id}`).send({ sigla });
            assertStatus(editada, 400);
            assert.match(editada.body.message, /Sigla igual ou semelhante/);
        });

        it('fonte removida pode ser cadastrada de novo', async () => {
            const fonte = uniq('Reaproveitada');
            const primeiro = await api(gestor).post('/api/fonte-recurso').send({ fonte });
            assertStatus(primeiro, 201);
            assertStatus(await api(gestor).delete(`/api/fonte-recurso/${primeiro.body.id}`), 202);

            assertStatus(await api(gestor).post('/api/fonte-recurso').send({ fonte }), 201);
        });
    });
});
