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
import { cenarioObras, criarPortfolio, criarProjeto } from './_helpers';

describe('projeto-tag', () => {
    let orgaoA: { id: number };
    let semPrivilegio: Sessao;
    let tagger: Sessao;
    let taggerMdo: Sessao;
    let projetoAdmin: Sessao;
    let portfolioA: { id: number };

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        semPrivilegio = await criarPessoaSemPrivilegios();
        tagger = await criarPessoaComPrivilegios(['ProjetoTag.inserir', 'ProjetoTag.editar', 'ProjetoTag.remover'], {
            orgao_id: orgaoA.id,
        });
        taggerMdo = await criarPessoaComPrivilegios(
            ['ProjetoTagMDO.inserir', 'ProjetoTagMDO.editar', 'ProjetoTagMDO.remover'],
            { orgao_id: orgaoA.id }
        );
        projetoAdmin = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios'], {
            orgao_id: orgaoA.id,
        });
        portfolioA = await criarPortfolio(projetoAdmin, 'PP', { orgaos: [orgaoA.id] });
    });

    describe('Projetos (projeto-tag)', () => {
        it('401 sem token e 403 sem ProjetoTag.inserir', async () => {
            assertStatus(await api().get('/api/projeto-tag'), 401);
            const res = await api(semPrivilegio).post('/api/projeto-tag').send({ descricao: uniq() });
            assertStatus(res, 403);
            assert.match(res.body.message, /ProjetoTag\.inserir/);
        });

        it('400 sem descricao', async () => {
            assertStatus(await api(tagger).post('/api/projeto-tag').send({}), 400);
        });

        it('cria, lê, lista e edita', async () => {
            const descricao = uniq('Urgente');
            const criado = await api(tagger).post('/api/projeto-tag').send({ descricao });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(semPrivilegio).get(`/api/projeto-tag/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.descricao, descricao);

            const lista = await api(semPrivilegio).get('/api/projeto-tag');
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === id));

            assertStatus(await api(tagger).patch(`/api/projeto-tag/${id}`).send({ descricao: uniq('Normal') }), 200);
        });

        it('400 com descrição igual, sem diferenciar maiúsculas', async () => {
            const descricao = uniq('Estratégico');
            assertStatus(await api(tagger).post('/api/projeto-tag').send({ descricao }), 201);
            const dup = await api(tagger).post('/api/projeto-tag').send({ descricao: descricao.toUpperCase() });
            assertStatus(dup, 400);
        });

        it('não remove tag em uso por projeto (400); remove a livre (202)', async () => {
            const emUso = (await api(tagger).post('/api/projeto-tag').send({ descricao: uniq('Usada') })).body;
            await criarProjeto(projetoAdmin, 'PP', { portfolio_id: portfolioA.id, tags: [emUso.id] });
            const res = await api(tagger).delete(`/api/projeto-tag/${emUso.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /em uso/);

            const livre = (await api(tagger).post('/api/projeto-tag').send({ descricao: uniq('Livre') })).body;
            assertStatus(await api(tagger).delete(`/api/projeto-tag/${livre.id}`), 202);
        });
    });

    describe('Obras (projeto-tag-mdo)', () => {
        it('tag de obra não aparece na lista de Projetos', async () => {
            const tag = await api(taggerMdo).post('/api/projeto-tag-mdo').send({ descricao: uniq('Obra') });
            assertStatus(tag, 201);
            const listaPP = await api(semPrivilegio).get('/api/projeto-tag');
            assert.equal(
                listaPP.body.linhas.some((l: { id: number }) => l.id === tag.body.id),
                false
            );
            const listaMdo = await api(semPrivilegio).get('/api/projeto-tag-mdo');
            assert.ok(listaMdo.body.linhas.some((l: { id: number }) => l.id === tag.body.id));
        });

        it('403 ao criar tag de obra só com ProjetoTag.inserir', async () => {
            assertStatus(await api(tagger).post('/api/projeto-tag-mdo').send({ descricao: uniq() }), 403);
        });

        it('tag de obra em uso não é removida', async () => {
            const obras = await cenarioObras();
            const tagMdo = await criarPessoaComPrivilegios(['ProjetoTagMDO.inserir', 'ProjetoTagMDO.remover'], {
                orgao_id: obras.orgao.id,
            });
            const tag = await api(tagMdo).post('/api/projeto-tag-mdo').send({ descricao: uniq('Obra em uso') });
            assertStatus(tag, 201);
            await criarProjeto(obras.adminMdo, 'MDO', { portfolio_id: obras.portfolio.id, tags: [tag.body.id] });

            const res = await api(tagMdo).delete(`/api/projeto-tag-mdo/${tag.body.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /em uso/);
        });
    });
});
