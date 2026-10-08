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

describe('modalidade-contratacao-mdo', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let obras: Awaited<ReturnType<typeof cenarioObras>>;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'ModalidadeContratacao.inserir',
            'ModalidadeContratacao.editar',
            'ModalidadeContratacao.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        obras = await cenarioObras();
    });

    it('401 sem token; GET só pede sessão; escrita pede ModalidadeContratacao.*', async () => {
        assertStatus(await api().get('/api/modalidade-contratacao-mdo'), 401);
        assertStatus(await api(semPrivilegio).get('/api/modalidade-contratacao-mdo'), 200);
        const res = await api(semPrivilegio).post('/api/modalidade-contratacao-mdo').send({ nome: uniq() });
        assertStatus(res, 403);
        assert.match(res.body.message, /ModalidadeContratacao\.inserir/);
    });

    it('400 sem nome e 400 com nome igual (sem diferenciar maiúsculas)', async () => {
        assertStatus(await api(gestor).post('/api/modalidade-contratacao-mdo').send({}), 400);
        const nome = uniq('Pregão');
        assertStatus(await api(gestor).post('/api/modalidade-contratacao-mdo').send({ nome }), 201);
        const dup = await api(gestor).post('/api/modalidade-contratacao-mdo').send({ nome: nome.toUpperCase() });
        assertStatus(dup, 400);
        assert.match(dup.body.message, /já existe/);
    });

    it('cria, lê, edita e remove', async () => {
        const criado = await api(gestor).post('/api/modalidade-contratacao-mdo').send({ nome: uniq('Concorrência') });
        assertStatus(criado, 201);
        const id: number = criado.body.id;

        const novo = uniq('Dispensa');
        assertStatus(await api(gestor).patch(`/api/modalidade-contratacao-mdo/${id}`).send({ nome: novo }), 200);
        const lido = await api(gestor).get(`/api/modalidade-contratacao-mdo/${id}`);
        assertStatus(lido, 200);
        assert.equal(lido.body.nome, novo);

        assertStatus(await api(gestor).delete(`/api/modalidade-contratacao-mdo/${id}`), 202);
    });

    it('não remove modalidade usada por obra (400)', async () => {
        const modalidade = await api(gestor).post('/api/modalidade-contratacao-mdo').send({ nome: uniq('Usada') });
        await criarProjeto(obras.adminMdo, 'MDO', {
            portfolio_id: obras.portfolio.id,
            modalidade_contratacao_id: modalidade.body.id,
        });
        const res = await api(gestor).delete(`/api/modalidade-contratacao-mdo/${modalidade.body.id}`);
        assertStatus(res, 400);
        assert.match(res.body.message, /Registro em uso em Projetos/);
    });
});
