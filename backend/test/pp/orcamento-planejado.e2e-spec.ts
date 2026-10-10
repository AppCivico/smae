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
} from '../lib';
import { criarPortfolio, criarProjeto } from './_helpers';

const DOTACAO = '12.34.56.789.0123.4.567.12345678.90';
const ANO = 2026;

describe('projeto-orcamento-planejado', () => {
    let orgaoA: { id: number };
    let admin: Sessao;
    let orcamentista: Sessao;
    let semPrivilegio: Sessao;
    let projetoA: { id: number };
    let projetoB: { id: number };

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios', 'Projeto.orcamento'], {
            orgao_id: orgaoA.id,
        });
        orcamentista = await criarPessoaComPrivilegios(['Projeto.orcamento', 'SMAE.gestor_de_projeto'], {
            orgao_id: orgaoA.id,
        });
        semPrivilegio = await criarPessoaSemPrivilegios();
        await prisma().dotacaoPlanejado.create({
            data: {
                informacao_valida: true,
                ano_referencia: ANO,
                mes_utilizado: 1,
                dotacao: DOTACAO,
                val_orcado_inicial: 10000,
                val_orcado_atualizado: 10000,
                saldo_disponivel: 10000,
            },
        });
        const portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
        projetoA = await criarProjeto(admin, 'PP', {
            portfolio_id: portfolio.id,
            responsaveis_no_orgao_gestor: [orcamentista.pessoa.id],
        });
        projetoB = await criarProjeto(admin, 'PP', { portfolio_id: portfolio.id });
    });

    const planejado = (dados: Record<string, unknown> = {}) => ({
        ano_referencia: ANO,
        dotacao: DOTACAO,
        valor_planejado: 250.5,
        ...dados,
    });

    describe('autenticação, privilégios e validação', () => {
        it('401 sem token e 403 sem Projeto.orcamento', async () => {
            assertStatus(await api().get(`/api/projeto/${projetoA.id}/orcamento-planejado?ano_referencia=${ANO}`), 401);
            const res = await api(semPrivilegio)
                .post(`/api/projeto/${projetoA.id}/orcamento-planejado`)
                .send(planejado());
            assertStatus(res, 403);
            assert.match(res.body.message, /Projeto\.orcamento/);
        });

        it('400 com dotação fora do formato e com dotação não importada', async () => {
            assertStatus(
                await api(orcamentista).post(`/api/projeto/${projetoA.id}/orcamento-planejado`).send(planejado({ dotacao: '123' })),
                400
            );
            const naoImportada = await api(orcamentista)
                .post(`/api/projeto/${projetoA.id}/orcamento-planejado`)
                .send(planejado({ dotacao: '99.99.99.999.9999.9.999.99999999.99' }));
            assertStatus(naoImportada, 400);
            assert.match(naoImportada.body.message, /ainda não foi importada/);
        });
    });

    describe('CRUD e unicidade por projeto', () => {
        let criado: { id: number };

        it('cria, lista por ano e confere o valor no banco', async () => {
            const res = await api(orcamentista).post(`/api/projeto/${projetoA.id}/orcamento-planejado`).send(planejado());
            assertStatus(res, 201);
            criado = res.body;

            const lista = await api(orcamentista).get(`/api/projeto/${projetoA.id}/orcamento-planejado?ano_referencia=${ANO}`);
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === criado.id);
            assert.ok(linha, 'orçamento criado não aparece na listagem');
            assert.equal(Number(linha.valor_planejado), 250.5);

            const noBanco = await prisma().orcamentoPlanejado.findUniqueOrThrow({ where: { id: criado.id } });
            assert.equal(Number(noBanco.valor_planejado), 250.5);
            assert.equal(noBanco.projeto_id, projetoA.id);
        });

        it('400 para a mesma dotação e ano no mesmo projeto', async () => {
            const res = await api(orcamentista).post(`/api/projeto/${projetoA.id}/orcamento-planejado`).send(planejado());
            assertStatus(res, 400);
            assert.match(res.body.message, /Já existe um registro com a mesma dotação/);
        });

        it('edita o valor e remove (202) sem aparecer mais na listagem', async () => {
            assertStatus(
                await api(orcamentista)
                    .patch(`/api/projeto/${projetoA.id}/orcamento-planejado/${criado.id}`)
                    .send({ valor_planejado: 300 }),
                200
            );
            const noBanco = await prisma().orcamentoPlanejado.findUniqueOrThrow({ where: { id: criado.id } });
            assert.equal(Number(noBanco.valor_planejado), 300);

            assertStatus(await api(orcamentista).delete(`/api/projeto/${projetoA.id}/orcamento-planejado/${criado.id}`), 202);
            const lista = await api(orcamentista).get(`/api/projeto/${projetoA.id}/orcamento-planejado?ano_referencia=${ANO}`);
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === criado.id),
                false
            );
        });
    });

    describe('isolamento por projeto', () => {
        it('não cria em projeto em que o usuário não está na equipe (400)', async () => {
            const res = await api(orcamentista).post(`/api/projeto/${projetoB.id}/orcamento-planejado`).send(planejado());
            assertStatus(res, 400);
        });

        it('não altera nem remove orçamento de outro projeto pelo caminho errado (404)', async () => {
            const criado = await api(orcamentista).post(`/api/projeto/${projetoA.id}/orcamento-planejado`).send(planejado());
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(
                await api(admin).patch(`/api/projeto/${projetoB.id}/orcamento-planejado/${id}`).send({ valor_planejado: 1 }),
                404
            );
            assertStatus(await api(admin).delete(`/api/projeto/${projetoB.id}/orcamento-planejado/${id}`), 404);

            const noBanco = await prisma().orcamentoPlanejado.findUniqueOrThrow({ where: { id } });
            assert.equal(Number(noBanco.valor_planejado), 250.5);
            assert.equal(noBanco.projeto_id, projetoA.id);
        });
    });
});
