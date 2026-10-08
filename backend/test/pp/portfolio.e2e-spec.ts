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
import { criarPortfolio, criarProjeto, ROTA } from './_helpers';

describe('portfolio', () => {
    let admin: Sessao;
    let semPrivilegio: Sessao;
    let soProjeto: Sessao;
    let orgaoA: { id: number };
    let orgaoB: { id: number };

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        orgaoB = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['Projeto.administrar_portfolios'], { orgao_id: orgaoA.id });
        semPrivilegio = await criarPessoaSemPrivilegios();
        soProjeto = await criarPessoaComPrivilegios(['Projeto.administrador'], { orgao_id: orgaoA.id });
    });

    describe('PP: autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/portfolio'), 401);
            assertStatus(await api().post('/api/portfolio').send({ titulo: uniq(), orgaos: [orgaoA.id] }), 401);
        });

        it('403 sem Projeto.administrar_portfolios', async () => {
            const res = await api(semPrivilegio).post('/api/portfolio').send({ titulo: uniq(), orgaos: [orgaoA.id] });
            assertStatus(res, 403);
            assert.match(res.body.message, /Projeto\.administrar_portfolios/);
        });

        it('403 para quem só administra projetos: não administra portfólios', async () => {
            assertStatus(await api(soProjeto).get('/api/portfolio'), 403);
            assertStatus(await api(soProjeto).get('/api/portfolio/para-projetos'), 200);
        });
    });

    describe('PP: validação', () => {
        it('400 sem titulo ou com orgaos vazio', async () => {
            assertStatus(await api(admin).post('/api/portfolio').send({ orgaos: [orgaoA.id] }), 400);
            assertStatus(await api(admin).post('/api/portfolio').send({ titulo: uniq(), orgaos: [] }), 400);
        });

        it('400 com nivel_maximo_tarefa fora de 1..32', async () => {
            const res = await api(admin)
                .post('/api/portfolio')
                .send({ titulo: uniq(), orgaos: [orgaoA.id], nivel_maximo_tarefa: 40 });
            assertStatus(res, 400);
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await api(admin).get('/api/portfolio/abc'), 400);
        });
    });

    describe('PP: CRUD', () => {
        it('cria, lê, edita e remove', async () => {
            const titulo = uniq('Saneamento');
            const criado = await api(admin).post('/api/portfolio').send({
                titulo,
                orgaos: [orgaoA.id],
                nivel_maximo_tarefa: 3,
                orcamento_execucao_disponivel_meses: [6, 1],
            });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(admin).get(`/api/portfolio/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.titulo, titulo);
            assert.deepEqual(lido.body.orgaos, [orgaoA.id]);
            assert.equal(lido.body.nivel_maximo_tarefa, 3);
            assert.deepEqual(lido.body.orcamento_execucao_disponivel_meses, [1, 6]);

            const novoTitulo = uniq('Saneamento Básico');
            assertStatus(await api(admin).patch(`/api/portfolio/${id}`).send({ titulo: novoTitulo }), 200);

            const lista = await api(admin).get('/api/portfolio');
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.equal(linha.titulo, novoTitulo);
            assert.equal(linha.pode_editar, true);

            assertStatus(await api(admin).delete(`/api/portfolio/${id}`), 202);
            assertStatus(await api(admin).get(`/api/portfolio/${id}`), 404);
        });

        it('400 com título igual, sem diferenciar maiúsculas', async () => {
            const titulo = uniq('Mobilidade');
            assertStatus(await api(admin).post('/api/portfolio').send({ titulo, orgaos: [orgaoA.id] }), 201);

            const duplicado = await api(admin)
                .post('/api/portfolio')
                .send({ titulo: titulo.toUpperCase(), orgaos: [orgaoA.id] });
            assertStatus(duplicado, 400);
            assert.match(duplicado.body.message, /já existe/);
        });

        it('400 ao remover portfólio com projetos ativos', async () => {
            const portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
            const projetoAdmin = await criarPessoaComPrivilegios(['Projeto.administrador'], { orgao_id: orgaoA.id });
            await criarProjeto(projetoAdmin, 'PP', { portfolio_id: portfolio.id });

            const res = await api(admin).delete(`/api/portfolio/${portfolio.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /há projetos dependentes/);
        });
    });

    describe('PP: órgão do portfólio', () => {
        let noOrgao: Sessao;
        let doOrgaoB: { id: number };
        let compartilhado: { id: number };

        before(async () => {
            noOrgao = await criarPessoaComPrivilegios(['Projeto.administrar_portfolios_no_orgao'], {
                orgao_id: orgaoA.id,
            });
            doOrgaoB = await criarPortfolio(admin, 'PP', { orgaos: [orgaoB.id] });
            compartilhado = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id, orgaoB.id] });
        });

        it('400 ao criar portfólio em outro órgão', async () => {
            const res = await api(noOrgao).post('/api/portfolio').send({ titulo: uniq(), orgaos: [orgaoB.id] });
            assertStatus(res, 400);
            assert.match(res.body.message, /próprio órgão/);
        });

        it('cria no próprio órgão e só vê o próprio órgão na listagem de edição', async () => {
            const meu = await criarPortfolio(noOrgao, 'PP', { orgaos: [orgaoA.id] });

            const lista = await api(noOrgao).get('/api/portfolio');
            assertStatus(lista, 200);
            const ids = lista.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(ids.includes(meu.id));
            assert.equal(ids.includes(doOrgaoB.id), false);
        });

        it('404 ao ler ou editar portfólio de outro órgão', async () => {
            assertStatus(await api(noOrgao).get(`/api/portfolio/${doOrgaoB.id}`), 404);
            assertStatus(await api(noOrgao).patch(`/api/portfolio/${doOrgaoB.id}`).send({ titulo: uniq() }), 404);
        });

        it('portfólio com mais de um órgão aparece, mas não é editável pelo órgão', async () => {
            const lista = await api(noOrgao).get('/api/portfolio');
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === compartilhado.id);
            assert.equal(linha.pode_editar, false);

            const res = await api(noOrgao).patch(`/api/portfolio/${compartilhado.id}`).send({ titulo: uniq() });
            assertStatus(res, 400);
            assert.match(res.body.message, /Sem permissão para editar/);
        });

        it('para-projetos: Projeto.administrador vê todos, administrador_no_orgao só os do órgão', async () => {
            const comoAdmin = await api(soProjeto).get('/api/portfolio/para-projetos');
            assertStatus(comoAdmin, 200);
            const idsAdmin = comoAdmin.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(idsAdmin.includes(doOrgaoB.id));

            const projetoNoOrgao = await criarPessoaComPrivilegios(['Projeto.administrador_no_orgao'], {
                orgao_id: orgaoA.id,
            });
            const comoOrgao = await api(projetoNoOrgao).get('/api/portfolio/para-projetos');
            assertStatus(comoOrgao, 200);
            const idsOrgao = comoOrgao.body.linhas.map((l: { id: number }) => l.id);
            assert.equal(idsOrgao.includes(doOrgaoB.id), false);
            assert.ok(idsOrgao.includes(compartilhado.id));
        });

        it('gestor de projeto lê o portfólio pelo GET /:id', { todo: 'BUG: GET /api/portfolio/:id devolve 400 para quem tem SMAE.gestor_de_projeto, apesar de a rota aceitar PROJETO_READONLY_ROLES (findAll exige administrar_portfolios_no_orgao quando listaParaProjetos=false)' }, async () => {
            const gestor = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoA.id });
            assertStatus(await api(gestor).get(`/api/portfolio/${compartilhado.id}`), 200);
        });
    });

    describe('MDO', () => {
        let adminMdo: Sessao;
        let portfolioPP: { id: number };

        before(async () => {
            adminMdo = await criarPessoaComPrivilegios(['ProjetoMDO.administrar_portfolios'], { orgao_id: orgaoA.id });
            portfolioPP = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
        });

        it('401 sem token e 403 sem ProjetoMDO.administrar_portfolios', async () => {
            assertStatus(await api().get(ROTA.MDO.portfolio), 401);
            assertStatus(await api(semPrivilegio).get(ROTA.MDO.portfolio), 403);
        });

        it('pessoa de MdO não acessa portfólios de Projetos (403) e vice-versa', async () => {
            assertStatus(await api(adminMdo).get(ROTA.PP.portfolio), 403);
            assertStatus(await api(admin).get(ROTA.MDO.portfolio), 403);
        });

        it('cria obra e força nivel_regionalizacao 3, mesmo se enviado outro', async () => {
            const criado = await api(adminMdo)
                .post(ROTA.MDO.portfolio)
                .send({ titulo: uniq('Obras'), orgaos: [orgaoA.id], nivel_regionalizacao: 1 });
            assertStatus(criado, 201);

            const lido = await api(adminMdo).get(`${ROTA.MDO.portfolio}/${criado.body.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.nivel_regionalizacao, 3);
        });

        it('400 ao alterar nivel_regionalizacao de obra', async () => {
            const criado = await api(adminMdo)
                .post(ROTA.MDO.portfolio)
                .send({ titulo: uniq('Obras'), orgaos: [orgaoA.id] });
            assertStatus(criado, 201);

            const res = await api(adminMdo)
                .patch(`${ROTA.MDO.portfolio}/${criado.body.id}`)
                .send({ nivel_regionalizacao: 2 });
            assertStatus(res, 400);
            assert.match(res.body.message, /Nível de regionalização inválido para MDO/);
        });

        it('portfólio de Projetos não existe para a rota de obras (404)', async () => {
            assertStatus(await api(adminMdo).get(`${ROTA.MDO.portfolio}/${portfolioPP.id}`), 404);
            assertStatus(await api(adminMdo).patch(`${ROTA.MDO.portfolio}/${portfolioPP.id}`).send({ titulo: uniq() }), 404);
        });

        it('header smae-sistemas=Projetos tira os privilégios de MdO: 400 "não tem mais permissões"', async () => {
            const res = await api(adminMdo, { sistema: 'Projetos' }).get(ROTA.MDO.portfolio);
            assertStatus(res, 400);
            assert.match(res.body.message, /não tem mais permissões/);
        });
    });
});
