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

const doProjeto = (linhas: { projeto: { id: number } | null }[], id: number) =>
    linhas.find((l) => l.projeto?.id === id);

async function criarPortfolio(tipo: Tipo) {
    const criadoPor = (await loginAsSuperAdmin()).pessoa.id;
    return prisma().portfolio.create({
        data: { titulo: uniq('portfolio'), tipo_projeto: tipo, criado_por: criadoPor },
    });
}

async function criarProjetoComPrevisao(tipo: Tipo, custo: number, ano: number) {
    const criadoPor = (await loginAsSuperAdmin()).pessoa.id;
    const portfolio = await criarPortfolio(tipo);
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
    await prisma().orcamentoPrevisto.create({
        data: {
            projeto_id: projeto.id,
            ano_referencia: ano,
            custo_previsto: custo,
            parte_dotacao: '10.*.12.361.*.2.100.*.00',
            ultima_revisao: true,
            criado_por: criadoPor,
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
        let semAcessoProjeto: Sessao;
        let portfolioId: number;
        let projeto: { id: number; nome: string };
        let vazioId: number;

        before(async () => {
            await bootApp();
            executor = await criarPessoaComPrivilegios([
                privilegio,
                tipo === 'PP' ? 'Projeto.administrador' : 'ProjetoMDO.administrador',
            ]);
            semAcessoProjeto = await criarPessoaComPrivilegios([privilegio]);
            semPrivilegio = await criarPessoaSemPrivilegios();
            ({ portfolioId, projeto } = await criarProjetoComPrevisao(tipo, 4200.5, 2027));
            vazioId = (await criarPortfolio(tipo)).id;
        });

        const corpo = (extra: Record<string, unknown> = {}) => ({ ano: 2027, portfolio_id: portfolioId, ...extra });

        it('401 sem token', async () => {
            assertStatus(await api().post(url).send(corpo()), 401);
        });

        it(`403 sem ${privilegio}`, async () => {
            const res = await api(semPrivilegio).post(url).send(corpo());
            assertStatus(res, 403);
            assert.match(res.body.message, new RegExp(privilegio.replace(/\./g, '\\.')));
        });

        it('400 sem portfolio_id, ano inválido ou periodo_ano fora do enum', async () => {
            const enviar = (corpoEnvio: Record<string, unknown>) => api(executor).post(url).send(corpoEnvio);
            assertStatus(await enviar({ ano: 2027 }), 400);
            assertStatus(await enviar({ ano: 2027, portfolio_id: 'x' }), 400);
            assertStatus(await enviar(corpo({ periodo_ano: 'Futuro' })), 400);
            assertStatus(await enviar(corpo({ ano: 'x', periodo_ano: undefined })), 400);
        });

        it('400 sem ano e sem periodo_ano Corrente', async () => {
            const res = await api(executor).post(url).send({ portfolio_id: portfolioId });
            assertStatus(res, 400);
            assert.match(res.body.message, /Ano de referência não informado/);
        });

        it('201 devolve a previsão de custo do projeto do portfólio', async () => {
            const res = await api(executor).post(url).send(corpo());
            assertStatus(res, 201);

            const linha = doProjeto(res.body.linhas, projeto.id) as Record<string, any>;
            assert.ok(linha, 'previsão do projeto não aparece');
            assert.equal(linha.projeto.nome, projeto.nome);
            assert.equal(linha.custo_previsto, '4200.50');
            assert.equal(linha.ano_referencia, 2027);
            assert.equal(linha.parte_dotacao, '10.**.12.361.****.2.100.********.00');
            assert.equal(linha.meta, null);
        });

        it('ano sem previsão, projeto_id de outro projeto e portfólio vazio devolvem linhas vazias', async () => {
            for (const extra of [{ ano: 2028 }, { projeto_id: projeto.id + 100000 }, { portfolio_id: vazioId }]) {
                const res = await api(executor).post(url).send(corpo(extra));
                assertStatus(res, 201);
                assert.deepEqual(res.body, { linhas: [] });
            }
        });

        it('periodo_ano Corrente dispensa o ano e usa o ano atual', async () => {
            const { portfolioId: corrente, projeto: projetoCorrente } = await criarProjetoComPrevisao(
                tipo,
                77,
                new Date().getFullYear()
            );

            const res = await api(executor).post(url).send({ portfolio_id: corrente, periodo_ano: 'Corrente' });
            assertStatus(res, 201);
            assert.ok(doProjeto(res.body.linhas, projetoCorrente.id));
        });

        it('não devolve previsão de portfólio do outro tipo', async () => {
            const outro = await criarProjetoComPrevisao(tipo === 'PP' ? 'MDO' : 'PP', 5, 2027);

            const res = await api(executor)
                .post(url)
                .send(corpo({ portfolio_id: outro.portfolioId }));
            assertStatus(res, 201);
            assert.deepEqual(res.body, { linhas: [] });
        });

        it('recusa usuário sem acesso a projetos', async () => {
            const res = await api(semAcessoProjeto).post(url).send(corpo());
            assertStatus(res, 400);
        });
    });
}

descreverRelatorio(
    'relatorio/projeto-previsao-custo',
    '/api/relatorio/projeto-previsao-custo',
    'PP',
    'Reports.executar.Projetos'
);
descreverRelatorio(
    'relatorio/projeto-previsao-custo-mdo',
    '/api/relatorio/projeto-previsao-custo-mdo',
    'MDO',
    'Reports.executar.MDO'
);
