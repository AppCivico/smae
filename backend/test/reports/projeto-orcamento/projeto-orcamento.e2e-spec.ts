import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../../lib';

type Tipo = 'PP' | 'MDO';

const DOTACAO = '11.10.12.361.3010.2.100.33903900.00';
const periodo = { tipo: 'Analitico', inicio: '2027-01-01', fim: '2027-12-01' };

async function criarProjetoComOrcamento(tipo: Tipo, planejado: string, empenhado: string) {
    const criadoPor = (await loginAsSuperAdmin()).pessoa.id;
    const portfolio = await prisma().portfolio.create({
        data: { titulo: uniq('portfolio'), tipo_projeto: tipo, criado_por: criadoPor },
    });
    const projeto = await prisma().projeto.create({
        data: {
            portfolio_id: portfolio.id,
            tipo,
            nome: uniq('projeto'),
            objeto: 'objeto',
            objetivo: 'objetivo',
            publico_alvo: 'público',
            resumo: 'resumo',
            status: tipo === 'PP' ? 'Registrado' : 'MDO_EmAndamento',
            fase: 'Registro',
            orgao_gestor_id: 1,
            registrado_em: new Date(),
            registrado_por: criadoPor,
        },
        select: { id: true, nome: true },
    });
    await prisma().orcamentoPlanejado.create({
        data: {
            projeto_id: projeto.id,
            dotacao: DOTACAO,
            ano_referencia: 2027,
            valor_planejado: planejado,
            criado_por: criadoPor,
        },
    });
    await prisma().orcamentoRealizado.create({
        data: {
            projeto_id: projeto.id,
            dotacao: DOTACAO,
            ano_referencia: 2027,
            mes_utilizado: 3,
            soma_valor_empenho: empenhado,
            soma_valor_liquidado: '0',
            criado_por: criadoPor,
            itens: {
                create: {
                    valor_empenho: empenhado,
                    valor_liquidado: '0',
                    mes: 3,
                    mes_corrente: true,
                    data_referencia: new Date('2027-03-01'),
                },
            },
        },
    });
    return { portfolioId: portfolio.id, projeto };
}

function descreverRelatorio(
    nome: string,
    url: string,
    tipo: Tipo,
    privilegio: 'Reports.executar.Projetos' | 'Reports.executar.MDO'
) {
    describe(nome, () => {
        let executor: Sessao;
        let semPrivilegio: Sessao;
        let portfolioId: number;
        let projeto: { id: number; nome: string };
        let vazioId: number;

        before(async () => {
            await bootApp();
            executor = await criarPessoaComPrivilegios([privilegio]);
            semPrivilegio = await criarPessoaSemPrivilegios();
            ({ portfolioId, projeto } = await criarProjetoComOrcamento(tipo, '2500.00', '800.40'));
            vazioId = (
                await prisma().portfolio.create({
                    data: {
                        titulo: uniq('portfolio'),
                        tipo_projeto: tipo,
                        criado_por: (await loginAsSuperAdmin()).pessoa.id,
                    },
                })
            ).id;
        });

        const corpo = (extra: Record<string, unknown> = {}) => ({ ...periodo, portfolio_id: portfolioId, ...extra });
        const doProjeto = (linhas: { projeto: { id: number } | null }[]) =>
            linhas.find((l) => l.projeto?.id === projeto.id);

        it('401 sem token', async () => {
            assertStatus(await api().post(url).send(corpo()), 401);
        });

        it(`403 sem ${privilegio}`, async () => {
            const res = await api(semPrivilegio).post(url).send(corpo());
            assertStatus(res, 403);
            assert.match(res.body.message, new RegExp(privilegio.replace(/\./g, '\\.')));
        });

        it('400 sem portfolio_id, tipo inválido, data fora do formato ou orgaos fora de array', async () => {
            const enviar = (extra: Record<string, unknown>) =>
                api(executor)
                    .post(url)
                    .send({ ...periodo, ...extra });
            assertStatus(await enviar({}), 400);
            assertStatus(await enviar({ portfolio_id: 'x' }), 400);
            assertStatus(await enviar({ portfolio_id: portfolioId, tipo: 'Foo' }), 400);
            assertStatus(await enviar({ portfolio_id: portfolioId, inicio: '01/01/2027' }), 400);
            assertStatus(await enviar({ portfolio_id: portfolioId, orgaos: 'x' }), 400);
        });

        it(
            '400 com corpo vazio',
            {
                todo: `BUG: POST ${url}: esperado 400 (portfolio_id, inicio e fim obrigatórios), veio 500 (DateTransform recebe undefined)`,
            },
            async () => {
                assertStatus(await api(executor).post(url).send({}), 400);
            }
        );

        it('201 devolve executado e planejado do projeto do portfólio', async () => {
            const res = await api(executor).post(url).send(corpo());
            assertStatus(res, 201);

            const executado = doProjeto(res.body.linhas) as Record<string, any>;
            assert.ok(executado, 'executado do projeto não aparece');
            assert.equal(executado.projeto.nome, projeto.nome);
            assert.equal(executado.dotacao, DOTACAO);
            assert.equal(Number(executado.smae_valor_empenhado), 800.4);
            assert.equal(executado.mes, 3);
            assert.equal(executado.ano, 2027);

            const planejado = doProjeto(res.body.linhas_planejado) as Record<string, any>;
            assert.ok(planejado, 'planejado do projeto não aparece');
            assert.equal(Number(planejado.plan_valor_planejado), 2500);
        });

        it('Consolidado também devolve o projeto, e projeto_id restringe ao projeto', async () => {
            const consolidado = await api(executor)
                .post(url)
                .send(corpo({ tipo: 'Consolidado' }));
            assertStatus(consolidado, 201);
            assert.ok(doProjeto(consolidado.body.linhas));
            assert.ok(doProjeto(consolidado.body.linhas_planejado));

            const outroProjeto = await api(executor)
                .post(url)
                .send(corpo({ projeto_id: projeto.id + 100000 }));
            assertStatus(outroProjeto, 201);
            assert.deepEqual(outroProjeto.body, { linhas: [], linhas_planejado: [] });
        });

        it(
            'não devolve orçamento de portfólio do outro tipo',
            {
                todo: `BUG: POST ${url}: esperado listas vazias para portfólio de ${tipo === 'PP' ? 'obras (MDO)' : 'projetos (PP)'}, veio o orçamento (sem filtro de tipo nem de permissão no projeto)`,
            },
            async () => {
                const outro = await criarProjetoComOrcamento(tipo === 'PP' ? 'MDO' : 'PP', '5', '5');

                const res = await api(executor)
                    .post(url)
                    .send(corpo({ portfolio_id: outro.portfolioId }));
                assertStatus(res, 201);
                assert.deepEqual(res.body, { linhas: [], linhas_planejado: [] });
            }
        );

        it('portfólio sem orçamento devolve listas vazias', async () => {
            const res = await api(executor)
                .post(url)
                .send(corpo({ portfolio_id: vazioId }));
            assertStatus(res, 201);
            assert.deepEqual(res.body, { linhas: [], linhas_planejado: [] });
        });
    });
}

descreverRelatorio(
    'relatorio/projeto-orcamento',
    '/api/relatorio/projeto-orcamento',
    'PP',
    'Reports.executar.Projetos'
);
descreverRelatorio(
    'relatorio/projeto-orcamento-mdo',
    '/api/relatorio/projeto-orcamento-mdo',
    'MDO',
    'Reports.executar.MDO'
);
