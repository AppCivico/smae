import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';
import { criarPortfolio, criarProjeto } from '../pp/_helpers';

const ETAPA_PP = [
    'CadastroProjetoEtapa.inserir',
    'CadastroProjetoEtapa.editar',
    'CadastroProjetoEtapa.remover',
    'CadastroProjetoEtapaPadrao.inserir',
    'CadastroProjetoEtapaPadrao.editar',
    'CadastroProjetoEtapaPadrao.remover',
] as const;

describe('projeto-etapa', () => {
    let orgaoA: { id: number };
    let orgaoB: { id: number };
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let portfolioA: { id: number };
    let portfolioB: { id: number };

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        orgaoB = await criarOrgao();
        gestor = await criarPessoaComPrivilegios(['Projeto.administrador', ...ETAPA_PP], { orgao_id: orgaoA.id });
        semPrivilegio = await criarPessoaSemPrivilegios();
        portfolioA = await criarPortfolio(
            await criarPessoaComPrivilegios(['Projeto.administrar_portfolios'], { orgao_id: orgaoA.id }),
            'PP',
            { orgaos: [orgaoA.id] }
        );
        portfolioB = await criarPortfolio(
            await criarPessoaComPrivilegios(['Projeto.administrar_portfolios'], { orgao_id: orgaoB.id }),
            'PP',
            { orgaos: [orgaoB.id] }
        );
    });

    const etapa = (dados: Record<string, unknown> = {}) => ({
        descricao: uniq('Etapa'),
        portfolio_id: portfolioA.id,
        ordem_painel: 1,
        ...dados,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/projeto-etapa'), 401);
            assertStatus(await api().post('/api/projeto-etapa').send(etapa()), 401);
        });

        it('403 sem privilégio de etapa de portfólio', async () => {
            const res = await api(semPrivilegio).post('/api/projeto-etapa').send(etapa());
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroProjetoEtapa\.inserir/);
        });

        it('403 para etapa padrão com só o privilégio de etapa de portfólio', async () => {
            const soPortfolio = await criarPessoaComPrivilegios(['Projeto.administrador', 'CadastroProjetoEtapa.inserir'], {
                orgao_id: orgaoA.id,
            });
            const res = await api(soPortfolio).post('/api/projeto-etapa').send(etapa({ eh_padrao: true }));
            assertStatus(res, 403);
            assert.match(res.body.message, /Privilégio necessário: CadastroProjetoEtapaPadrao\.inserir/);
        });

        it('privilégios de obra não criam etapa de Projetos (403 pela guarda)', async () => {
            const soObra = await criarPessoaComPrivilegios(['CadastroProjetoEtapaMDO.inserir'], { orgao_id: orgaoA.id });
            assertStatus(await api(soObra).post('/api/projeto-etapa').send(etapa()), 403);
        });

        it('header smae-sistemas=MDO tira os privilégios de Projetos: 400 "não tem mais permissões"', async () => {
            const res = await api(gestor, { sistema: 'MDO' }).get('/api/projeto-etapa');
            assertStatus(res, 400);
            assert.match(res.body.message, /não tem mais permissões/);
        });
    });

    describe('validação', () => {
        it('400 sem descricao, com ordem_painel 0 ou com :id não numérico', async () => {
            assertStatus(await api(gestor).post('/api/projeto-etapa').send({ portfolio_id: portfolioA.id }), 400);
            assertStatus(await api(gestor).post('/api/projeto-etapa').send(etapa({ ordem_painel: 0 })), 400);
            assertStatus(await api(gestor).patch('/api/projeto-etapa/abc').send({ descricao: uniq() }), 400);
        });
    });

    describe('etapa de portfólio', () => {
        let criada: { id: number };
        let descricao: string;

        before(async () => {
            descricao = uniq('Licitação');
            const res = await api(gestor).post('/api/projeto-etapa').send(etapa({ descricao }));
            assertStatus(res, 201);
            criada = res.body;
        });

        it('lista por portfólio e mostra o portfólio da etapa', async () => {
            const lista = await api(gestor).get(`/api/projeto-etapa?portfolio_id=${portfolioA.id}`);
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === criada.id);
            assert.ok(linha, 'etapa criada não aparece na listagem do portfólio');
            assert.equal(linha.eh_padrao, false);
            assert.equal(linha.portfolio.id, portfolioA.id);
        });

        it('400 com descrição igual no mesmo portfólio, sem diferenciar maiúsculas', async () => {
            const res = await api(gestor).post('/api/projeto-etapa').send(etapa({ descricao: descricao.toUpperCase() }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Descrição igual ou semelhante/);
        });

        it('mesma descrição em outro portfólio é permitida', async () => {
            const res = await api(gestor).post('/api/projeto-etapa').send(etapa({ descricao, portfolio_id: portfolioB.id }));
            assertStatus(res, 201);
        });

        it('edita a descrição e remove (202), que tira a etapa da listagem', async () => {
            const nova = uniq('Contratação');
            assertStatus(await api(gestor).patch(`/api/projeto-etapa/${criada.id}`).send({ descricao: nova }), 200);
            const depoisDeEditar = await api(gestor).get(`/api/projeto-etapa?portfolio_id=${portfolioA.id}`);
            const linha = depoisDeEditar.body.linhas.find((l: { id: number }) => l.id === criada.id);
            assert.equal(linha.descricao, nova);

            assertStatus(await api(gestor).delete(`/api/projeto-etapa/${criada.id}`), 202);
            const depoisDeRemover = await api(gestor).get(`/api/projeto-etapa?portfolio_id=${portfolioA.id}`);
            assert.equal(
                depoisDeRemover.body.linhas.some((l: { id: number }) => l.id === criada.id),
                false
            );
        });

        it('404 ao remover etapa que não existe', async () => {
            assertStatus(await api(gestor).delete('/api/projeto-etapa/999999'), 404);
        });

        it('404 ao listar etapas de portfólio que o órgão não vê', async () => {
            const umOrgao = await criarPessoaComPrivilegios(['Projeto.administrador_no_orgao'], { orgao_id: orgaoA.id });
            const res = await api(umOrgao).get(`/api/projeto-etapa?portfolio_id=${portfolioB.id}`);
            assertStatus(res, 404);
            assert.match(res.body.message, /Portfólio não encontrado/);
        });

        it('400 ao combinar portfolio_id com eh_padrao=true', async () => {
            const res = await api(gestor).get(`/api/projeto-etapa?eh_padrao=true&portfolio_id=${portfolioA.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /Não é possível filtrar por portfólio/);
        });

        it('etapa em uso por projeto não pode ser removida', async () => {
            const usada = await api(gestor).post('/api/projeto-etapa').send(etapa());
            assertStatus(usada, 201);
            await criarProjeto(gestor, 'PP', { portfolio_id: portfolioA.id, projeto_etapa_id: usada.body.id });

            const res = await api(gestor).delete(`/api/projeto-etapa/${usada.body.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /Etapa em uso em projetos/);
        });
    });

    describe('etapa padrão e ordem_painel', () => {
        it('400 se a etapa padrão também recebe etapa_padrao_id', async () => {
            const res = await api(gestor)
                .post('/api/projeto-etapa')
                .send(etapa({ eh_padrao: true, portfolio_id: undefined, etapa_padrao_id: 1 }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Não pode informar etapa padrão se o registro for padrão/);
        });

        it('400 ao apontar como padrão uma etapa que não é padrão', async () => {
            const deUmPortfolio = await api(gestor).post('/api/projeto-etapa').send(etapa());
            assertStatus(deUmPortfolio, 201);
            const res = await api(gestor)
                .post('/api/projeto-etapa')
                .send(etapa({ portfolio_id: portfolioB.id, etapa_padrao_id: deUmPortfolio.body.id }));
            assertStatus(res, 400);
            assert.match(res.body.message, /não está marcada como padrão/);
        });

        it('inserir numa posição ocupada empurra as seguintes; remover fecha o buraco', async () => {
            const primeira = await api(gestor).post('/api/projeto-etapa').send(
                etapa({ eh_padrao: true, portfolio_id: undefined, ordem_painel: 1 })
            );
            assertStatus(primeira, 201);
            const ordemDe = async (id: number): Promise<number> =>
                (await prisma().projetoEtapa.findUniqueOrThrow({ where: { id } })).ordem_painel ?? 0;

            const inicio = await ordemDe(primeira.body.id);
            const segunda = await api(gestor).post('/api/projeto-etapa').send(
                etapa({ eh_padrao: true, portfolio_id: undefined, ordem_painel: inicio })
            );
            assertStatus(segunda, 201);
            assert.equal(await ordemDe(segunda.body.id), inicio);
            assert.equal(await ordemDe(primeira.body.id), inicio + 1);

            assertStatus(await api(gestor).delete(`/api/projeto-etapa/${segunda.body.id}`), 202);
            assert.equal(await ordemDe(primeira.body.id), inicio);
        });

        it('ordem além do fim é truncada para max+1', async () => {
            const maior = await prisma().projetoEtapa.aggregate({
                where: { tipo_projeto: 'PP', eh_padrao: true, removido_em: null },
                _max: { ordem_painel: true },
            });
            const fim = (maior._max.ordem_painel ?? 0) + 1;
            const res = await api(gestor).post('/api/projeto-etapa').send(
                etapa({ eh_padrao: true, portfolio_id: undefined, ordem_painel: 999999 })
            );
            assertStatus(res, 201);
            const noBanco = await prisma().projetoEtapa.findUniqueOrThrow({ where: { id: res.body.id } });
            assert.equal(noBanco.ordem_painel, fim);
        });

        it('deixar de ser padrão é 400 enquanto outra etapa usa esta como padrão', async () => {
            const padrao = await api(gestor).post('/api/projeto-etapa').send(
                etapa({ eh_padrao: true, portfolio_id: undefined })
            );
            assertStatus(padrao, 201);
            const filha = await api(gestor).post('/api/projeto-etapa').send(
                etapa({ portfolio_id: portfolioA.id, etapa_padrao_id: padrao.body.id })
            );
            assertStatus(filha, 201);

            const res = await api(gestor)
                .patch(`/api/projeto-etapa/${padrao.body.id}`)
                .send({ eh_padrao: false });
            assertStatus(res, 400);
            assert.match(res.body.message, /Não pode deixar de ser padrão/);
        });

        it(
            'lista etapas padrão sem papel de projeto',
            {
                todo: 'BUG: GET /api/projeto-etapa?eh_padrao=true devolve 400 "Sem permissões para acesso aos projetos." para quem só tem CadastroProjetoEtapaPadrao, porque findAll consulta o portfólio mesmo quando eh_padrao=true (o comentário diz que não olha)',
            },
            async () => {
                const soPadrao = await criarPessoaComPrivilegios(['CadastroProjetoEtapaPadrao.editar'], {
                    orgao_id: orgaoA.id,
                });
                assertStatus(await api(soPadrao).get('/api/projeto-etapa?eh_padrao=true'), 200);
            }
        );

        it('converter etapa de portfólio em padrão exige também o privilégio de portfólio', async () => {
            const soEditaPadrao = await criarPessoaComPrivilegios(
                ['Projeto.administrador', 'CadastroProjetoEtapaPadrao.editar'],
                { orgao_id: orgaoA.id }
            );
            const comum = await api(gestor).post('/api/projeto-etapa').send(etapa());
            assertStatus(comum, 201);

            const res = await api(soEditaPadrao)
                .patch(`/api/projeto-etapa/${comum.body.id}`)
                .send({ eh_padrao: true });
            assertStatus(res, 403);
            assert.match(res.body.message, /Sem permissão para converter/);
        });
    });

    describe('obras (projeto-etapa-mdo)', () => {
        it('cria etapa de obra com CadastroProjetoEtapaMDO.inserir, separada das de Projetos', async () => {
            const obra = await criarPessoaComPrivilegios(
                ['Projeto.administrador', 'ProjetoMDO.administrador', 'CadastroProjetoEtapaMDO.inserir'],
                { orgao_id: orgaoA.id }
            );
            const mdoPortfolio = await criarPortfolio(
                await criarPessoaComPrivilegios(['ProjetoMDO.administrar_portfolios'], { orgao_id: orgaoA.id }),
                'MDO',
                { orgaos: [orgaoA.id] }
            );
            const criada = await api(obra)
                .post('/api/projeto-etapa-mdo')
                .send(etapa({ portfolio_id: mdoPortfolio.id }));
            assertStatus(criada, 201);

            const lista = await api(obra).get(`/api/projeto-etapa-mdo?portfolio_id=${mdoPortfolio.id}`);
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === criada.body.id));

            const naoEhDeProjetos = await api(obra).get(`/api/projeto-etapa?portfolio_id=${mdoPortfolio.id}`);
            assertStatus(naoEhDeProjetos, 404);
        });
    });
});
