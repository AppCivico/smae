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
import { criarPortfolio, criarProjeto } from './_helpers';

describe('portfolio-tag', () => {
    let orgaoA: { id: number };
    let orgaoB: { id: number };
    let tagger: Sessao;
    let semPrivilegio: Sessao;
    let projetoAdmin: Sessao;
    let noOrgaoA: Sessao;
    let vendoOrgaoA: Sessao;
    let portfolioA: { id: number };
    let portfolioB: { id: number };

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        orgaoB = await criarOrgao();
        tagger = await criarPessoaComPrivilegios(
            [
                'CadastroPortfolioTag.inserir',
                'CadastroPortfolioTag.editar',
                'CadastroPortfolioTag.remover',
                'Projeto.administrar_portfolios',
                'Projeto.administrador',
            ],
            { orgao_id: orgaoA.id }
        );
        semPrivilegio = await criarPessoaSemPrivilegios();
        projetoAdmin = await criarPessoaComPrivilegios(['Projeto.administrador'], { orgao_id: orgaoA.id });
        vendoOrgaoA = await criarPessoaComPrivilegios(['Projeto.administrador_no_orgao'], { orgao_id: orgaoA.id });
        noOrgaoA = await criarPessoaComPrivilegios(
            ['Projeto.administrar_portfolios_no_orgao', 'CadastroPortfolioTag.inserir'],
            { orgao_id: orgaoA.id }
        );
        portfolioA = await criarPortfolio(tagger, 'PP', { orgaos: [orgaoA.id] });
        portfolioB = await criarPortfolio(tagger, 'PP', { orgaos: [orgaoB.id] });
    });

    describe('autenticação, privilégios e validação', () => {
        it('401 sem token e 403 sem CadastroPortfolioTag.inserir', async () => {
            assertStatus(await api().get('/api/portfolio-tag'), 401);
            const res = await api(semPrivilegio)
                .post('/api/portfolio-tag')
                .send({ portfolio_id: portfolioA.id, descricao: uniq() });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroPortfolioTag\.inserir/);
        });

        it('400 sem descricao', async () => {
            assertStatus(await api(tagger).post('/api/portfolio-tag').send({ portfolio_id: portfolioA.id }), 400);
        });

        it('404 ao criar tag em portfólio que o usuário não administra', async () => {
            const res = await api(noOrgaoA)
                .post('/api/portfolio-tag')
                .send({ portfolio_id: portfolioB.id, descricao: uniq() });
            assertStatus(res, 404);
        });
    });

    describe('CRUD', () => {
        let tag: { id: number };
        let descricao: string;

        before(async () => {
            descricao = uniq('Prioritário');
            const res = await api(tagger).post('/api/portfolio-tag').send({ portfolio_id: portfolioA.id, descricao });
            assertStatus(res, 201);
            tag = res.body;
        });

        it('lista por portfólio e lê a tag', async () => {
            const lista = await api(tagger).get(`/api/portfolio-tag?portfolio_id=${portfolioA.id}`);
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === tag.id));

            const lido = await api(tagger).get(`/api/portfolio-tag/${tag.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.descricao, descricao);
        });

        it('400 com descrição igual no mesmo portfólio; permitida em outro portfólio', async () => {
            const dup = await api(tagger)
                .post('/api/portfolio-tag')
                .send({ portfolio_id: portfolioA.id, descricao: descricao.toUpperCase() });
            assertStatus(dup, 400);
            assertStatus(await api(tagger).post('/api/portfolio-tag').send({ portfolio_id: portfolioB.id, descricao }), 201);
        });

        it('404 ao filtrar tags de portfólio fora do órgão', async () => {
            const res = await api(vendoOrgaoA).get(`/api/portfolio-tag?portfolio_id=${portfolioB.id}`);
            assertStatus(res, 404);
            assert.match(res.body.message, /Portfólio não encontrado/);
        });

        it('edita e remove uma tag sem uso (202)', async () => {
            const sozinha = await api(tagger).post('/api/portfolio-tag').send({ portfolio_id: portfolioA.id, descricao: uniq('Sozinha') });
            assertStatus(
                await api(tagger)
                    .patch(`/api/portfolio-tag/${sozinha.body.id}`)
                    .send({ portfolio_id: portfolioA.id, descricao: uniq('Nova') }),
                200
            );
            assertStatus(await api(tagger).delete(`/api/portfolio-tag/${sozinha.body.id}`), 202);
        });
    });

    describe('tag em uso por projeto', () => {
        let tagUsada: { id: number };

        before(async () => {
            tagUsada = (await api(tagger).post('/api/portfolio-tag').send({ portfolio_id: portfolioA.id, descricao: uniq('Em uso') })).body;
            await criarProjeto(projetoAdmin, 'PP', { portfolio_id: portfolioA.id, tags_portfolio: [tagUsada.id] });
        });

        it('não remove tag em uso por projeto (400)', async () => {
            const remove = await api(tagger).delete(`/api/portfolio-tag/${tagUsada.id}`);
            assertStatus(remove, 400);
            assert.match(remove.body.message, /em uso em projetos/);
        });

        it(
            'não edita tag em uso por projeto (400)',
            {
                todo: 'BUG: PortfolioTagService.upsert confere uso com portfolio: { id: dto.portfolio_id }, que filtra o relacionamento PortfolioTag pelo id do portfólio (não do projeto), então a edição de tag em uso passa',
            },
            async () => {
                const edita = await api(tagger)
                    .patch(`/api/portfolio-tag/${tagUsada.id}`)
                    .send({ portfolio_id: portfolioA.id, descricao: uniq() });
                assertStatus(edita, 400);
                assert.match(edita.body.message, /Edição não permitida/);
            }
        );
    });
});
