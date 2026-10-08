import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    Sessao,
    uniq,
} from '../lib';

describe('tipo-orgao', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTipoOrgao.inserir',
            'CadastroTipoOrgao.editar',
            'CadastroTipoOrgao.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/tipo-orgao'), 401);
            assertStatus(await api().post('/api/tipo-orgao').send({ descricao: uniq() }), 401);
        });

        it('GET não exige privilégio, só sessão', async () => {
            assertStatus(await api(semPrivilegio).get('/api/tipo-orgao'), 200);
        });

        it('403 sem CadastroTipoOrgao.inserir', async () => {
            const res = await api(semPrivilegio).post('/api/tipo-orgao').send({ descricao: uniq() });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroTipoOrgao\.inserir/);
        });
    });

    describe('validação', () => {
        it('400 sem descricao', async () => {
            assertStatus(await api(gestor).post('/api/tipo-orgao').send({}), 400);
        });

        it('400 com descricao vazia', async () => {
            assertStatus(await api(gestor).post('/api/tipo-orgao').send({ descricao: '' }), 400);
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await api(gestor).patch('/api/tipo-orgao/abc').send({ descricao: uniq() }), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lista, edita e remove', async () => {
            const descricao = uniq('Autarquia');
            const criado = await api(gestor).post('/api/tipo-orgao').send({ descricao });
            assertStatus(criado, 201);
            assert.equal(typeof criado.body.id, 'number');
            const id: number = criado.body.id;

            const lista = await api(gestor).get('/api/tipo-orgao');
            assertStatus(lista, 200);
            assert.deepEqual(
                lista.body.linhas.find((l: { id: number }) => l.id === id),
                { id, descricao }
            );

            const duplicado = await api(gestor).post('/api/tipo-orgao').send({ descricao });
            assertStatus(duplicado, 400);

            const novaDescricao = uniq('Fundação');
            assertStatus(await api(gestor).patch(`/api/tipo-orgao/${id}`).send({ descricao: novaDescricao }), 200);
            const depoisDeEditar = await api(gestor).get('/api/tipo-orgao');
            assert.equal(depoisDeEditar.body.linhas.find((l: { id: number }) => l.id === id).descricao, novaDescricao);

            assertStatus(await api(gestor).delete(`/api/tipo-orgao/${id}`), 202);
            const depoisDeRemover = await api(gestor).get('/api/tipo-orgao');
            assert.equal(
                depoisDeRemover.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('400 ao remover tipo com órgão ativo', async () => {
            const tipo = await api(gestor).post('/api/tipo-orgao').send({ descricao: uniq() });
            assertStatus(tipo, 201);
            await criarOrgao({ tipo_orgao_id: tipo.body.id });

            const res = await api(gestor).delete(`/api/tipo-orgao/${tipo.body.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /dependentes/);
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/tipo-orgao/999999').send({ descricao: uniq() }), 404);
        });
    });
});
