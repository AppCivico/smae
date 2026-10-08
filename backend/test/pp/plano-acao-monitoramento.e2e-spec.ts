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
import { criarPortfolio, criarProjeto } from './_helpers';

describe('projeto-plano-acao-monitoramento', () => {
    let orgaoA: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let colaboradorFora: Sessao;
    let semPrivilegio: Sessao;
    let projetoA: { id: number };
    let projetoB: { id: number };
    let planoA: { id: number };
    let planoB: { id: number };

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios'], {
            orgao_id: orgaoA.id,
        });
        gestorA = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoA.id });
        colaboradorFora = await criarPessoaComPrivilegios(['SMAE.colaborador_de_projeto'], { orgao_id: orgaoA.id });
        semPrivilegio = await criarPessoaSemPrivilegios();
        const portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
        projetoA = await criarProjeto(admin, 'PP', {
            portfolio_id: portfolio.id,
            responsaveis_no_orgao_gestor: [gestorA.pessoa.id],
        });
        projetoB = await criarProjeto(admin, 'PP', { portfolio_id: portfolio.id });

        const planoDe = async (projeto: { id: number }, sessao: Sessao) => {
            const risco = (
                await api(sessao).post(`/api/projeto/${projeto.id}/risco`).send({
                    titulo: uniq('Risco'),
                    registrado_em: '2026-03-10',
                    probabilidade: 2,
                    impacto: 2,
                })
            ).body;
            const res = await api(sessao)
                .post(`/api/projeto/${projeto.id}/plano-de-acao`)
                .send({
                    projeto_risco_id: risco.id,
                    orgao_id: orgaoA.id,
                    contramedida: uniq('Plano'),
                    prazo_contramedida: '2026-06-01',
                });
            assertStatus(res, 201);
            return res.body as { id: number };
        };
        planoA = await planoDe(projetoA, gestorA);
        planoB = await planoDe(projetoB, admin);
    });

    const afericao = (planoId: number, dados: Record<string, unknown> = {}) => ({
        plano_acao_id: planoId,
        data_afericao: '2026-04-01',
        descricao: uniq('Aferição'),
        ...dados,
    });

    describe('autenticação, privilégios e validação', () => {
        it('401 sem token, 403 sem papel, 400 para quem não enxerga o projeto', async () => {
            assertStatus(await api().get(`/api/projeto/${projetoA.id}/plano-acao-monitoramento`), 401);
            assertStatus(
                await api(semPrivilegio).post(`/api/projeto/${projetoA.id}/plano-acao-monitoramento`).send(afericao(planoA.id)),
                403
            );
            const fora = await api(colaboradorFora)
                .post(`/api/projeto/${projetoA.id}/plano-acao-monitoramento`)
                .send(afericao(planoA.id));
            assertStatus(fora, 400);
        });

        it('400 sem descricao', async () => {
            assertStatus(
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/plano-acao-monitoramento`)
                    .send({ plano_acao_id: planoA.id, data_afericao: '2026-04-01' }),
                400
            );
        });
    });

    describe('aferições', () => {
        let antiga: { id: number };
        let recente: { id: number };

        before(async () => {
            const a = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/plano-acao-monitoramento`)
                .send(afericao(planoA.id, { data_afericao: '2026-04-01' }));
            assertStatus(a, 201);
            antiga = a.body;
            const r = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/plano-acao-monitoramento`)
                .send(afericao(planoA.id, { data_afericao: '2026-05-01', descricao: 'Mais recente' }));
            assertStatus(r, 201);
            recente = r.body;
        });

        it('404 ao aferir plano de ação de outro projeto', async () => {
            const res = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/plano-acao-monitoramento`)
                .send(afericao(planoB.id));
            assertStatus(res, 404);
            assert.match(res.body.message, /Não foi encontrado nenhum plano de ação/);
        });

        it('só a aferição mais recente fica marcada como última revisão', async () => {
            const antigaNoBanco = await prisma().planoAcaoMonitoramento.findUniqueOrThrow({ where: { id: antiga.id } });
            const recenteNoBanco = await prisma().planoAcaoMonitoramento.findUniqueOrThrow({ where: { id: recente.id } });
            assert.equal(recenteNoBanco.ultima_revisao, true);
            assert.equal(antigaNoBanco.ultima_revisao, false);
        });

        it('lista por plano e filtra apenas a última revisão', async () => {
            const lista = await api(gestorA).get(
                `/api/projeto/${projetoA.id}/plano-acao-monitoramento?plano_acao_id=${planoA.id}`
            );
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === antiga.id));

            const ultima = await api(gestorA).get(
                `/api/projeto/${projetoA.id}/plano-acao-monitoramento?plano_acao_id=${planoA.id}&apenas_ultima_revisao=true`
            );
            assertStatus(ultima, 200);
            const ids = ultima.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(ids.includes(recente.id));
            assert.equal(ids.includes(antiga.id), false);
        });

        it('edita a própria aferição; pelo caminho de outro projeto dá 404', async () => {
            assertStatus(
                await api(gestorA)
                    .patch(`/api/projeto/${projetoA.id}/plano-acao-monitoramento/${antiga.id}`)
                    .send({ descricao: 'Revisada' }),
                200
            );
            const noBanco = await prisma().planoAcaoMonitoramento.findUniqueOrThrow({ where: { id: antiga.id } });
            assert.equal(noBanco.descricao, 'Revisada');

            assertStatus(
                await api(admin)
                    .patch(`/api/projeto/${projetoB.id}/plano-acao-monitoramento/${antiga.id}`)
                    .send({ descricao: 'Invadido' }),
                404
            );
        });

        it('remove a própria aferição (202); pelo caminho de outro projeto não remove', async () => {
            const descartavel = (
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/plano-acao-monitoramento`)
                    .send(afericao(planoA.id))
            ).body;
            assertStatus(await api(admin).delete(`/api/projeto/${projetoB.id}/plano-acao-monitoramento/${descartavel.id}`), 404);
            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/plano-acao-monitoramento/${descartavel.id}`), 202);
            const noBanco = await prisma().planoAcaoMonitoramento.findUniqueOrThrow({ where: { id: descartavel.id } });
            assert.ok(noBanco.removido_em);
        });
    });
});
