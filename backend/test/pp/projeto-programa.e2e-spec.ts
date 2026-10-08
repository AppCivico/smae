import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    Sessao,
    uniq,
} from '../lib';
import { cenarioObras, criarProjeto } from './_helpers';

describe('projeto-programa-mdo', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let obras: Awaited<ReturnType<typeof cenarioObras>>;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'ProjetoProgramaMDO.inserir',
            'ProjetoProgramaMDO.editar',
            'ProjetoProgramaMDO.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        obras = await cenarioObras();
    });

    it('401 sem token; 403 sem ProjetoProgramaMDO.inserir', async () => {
        assertStatus(await api().get('/api/projeto-programa-mdo'), 401);
        const res = await api(semPrivilegio).post('/api/projeto-programa-mdo').send({ nome: uniq() });
        assertStatus(res, 403);
        assert.match(res.body.message, /ProjetoProgramaMDO\.inserir/);
    });

    it('400 sem nome e 400 com nome igual (sem diferenciar maiúsculas)', async () => {
        assertStatus(await api(gestor).post('/api/projeto-programa-mdo').send({}), 400);
        const nome = uniq('Minha Casa');
        assertStatus(await api(gestor).post('/api/projeto-programa-mdo').send({ nome }), 201);
        const dup = await api(gestor).post('/api/projeto-programa-mdo').send({ nome: nome.toUpperCase() });
        assertStatus(dup, 400);
    });

    it('cria, lê, edita e remove', async () => {
        const criado = await api(gestor).post('/api/projeto-programa-mdo').send({ nome: uniq('Programa') });
        assertStatus(criado, 201);
        const id: number = criado.body.id;

        const novo = uniq('Programa novo');
        assertStatus(await api(gestor).patch(`/api/projeto-programa-mdo/${id}`).send({ nome: novo }), 200);
        assert.equal((await api(gestor).get(`/api/projeto-programa-mdo/${id}`)).body.nome, novo);

        assertStatus(await api(gestor).delete(`/api/projeto-programa-mdo/${id}`), 202);
    });

    it('não remove programa usado por obra (400)', async () => {
        const programa = await api(gestor).post('/api/projeto-programa-mdo').send({ nome: uniq('Em uso') });
        await criarProjeto(obras.adminMdo, 'MDO', { portfolio_id: obras.portfolio.id, programa_id: programa.body.id });
        const res = await api(gestor).delete(`/api/projeto-programa-mdo/${programa.body.id}`);
        assertStatus(res, 400);
        assert.match(res.body.message, /Registro em uso em Projetos/);
    });
});
