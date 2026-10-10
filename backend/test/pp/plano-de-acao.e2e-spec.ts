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

describe('projeto-plano-de-acao', () => {
    let orgaoA: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let colaboradorFora: Sessao;
    let semPrivilegio: Sessao;
    let projetoA: { id: number };
    let projetoB: { id: number };
    let riscoA: { id: number };
    let riscoB: { id: number };

    const plano = (dados: Record<string, unknown> = {}) => ({
        projeto_risco_id: riscoA.id,
        orgao_id: orgaoA.id,
        contramedida: uniq('Contramedida'),
        prazo_contramedida: '2026-06-01',
        ...dados,
    });

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
        riscoA = (await api(gestorA).post(`/api/projeto/${projetoA.id}/risco`).send({
            titulo: uniq('Risco A'),
            registrado_em: '2026-03-10',
            probabilidade: 2,
            impacto: 2,
        })).body;
        riscoB = (await api(admin).post(`/api/projeto/${projetoB.id}/risco`).send({
            titulo: uniq('Risco B'),
            registrado_em: '2026-03-10',
            probabilidade: 2,
            impacto: 2,
        })).body;
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get(`/api/projeto/${projetoA.id}/plano-de-acao`), 401);
            assertStatus(await api().post(`/api/projeto/${projetoA.id}/plano-de-acao`).send(plano()), 401);
        });

        it('403 sem papel de projeto', async () => {
            assertStatus(await api(semPrivilegio).post(`/api/projeto/${projetoA.id}/plano-de-acao`).send(plano()), 403);
        });

        it('400 para colaborador fora da equipe, que nem enxerga o projeto', async () => {
            const res = await api(colaboradorFora).post(`/api/projeto/${projetoA.id}/plano-de-acao`).send(plano());
            assertStatus(res, 400);
            assert.match(res.body.message, /sem permissão para acesso/);
        });
    });

    describe('validação', () => {
        it('400 sem contramedida e com projeto_risco_id que não é número', async () => {
            assertStatus(
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/plano-de-acao`)
                    .send({ projeto_risco_id: riscoA.id, orgao_id: orgaoA.id }),
                400
            );
            assertStatus(
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/plano-de-acao`)
                    .send(plano({ projeto_risco_id: 'x' })),
                400
            );
        });
    });

    describe('CRUD', () => {
        let criado: { id: number };
        let contramedida: string;

        before(async () => {
            contramedida = uniq('Plano');
            const res = await api(gestorA).post(`/api/projeto/${projetoA.id}/plano-de-acao`).send(plano({ contramedida }));
            assertStatus(res, 201);
            criado = res.body;
        });

        it('lista do projeto e lê um plano', async () => {
            const lista = await api(gestorA).get(`/api/projeto/${projetoA.id}/plano-de-acao`);
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === criado.id));

            const lido = await api(gestorA).get(`/api/projeto/${projetoA.id}/plano-de-acao/${criado.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.contramedida, contramedida);
        });

        it('400 ao criar com risco de outro projeto', async () => {
            const res = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/plano-de-acao`)
                .send(plano({ projeto_risco_id: riscoB.id }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Inválido/);
        });

        it('400 ao ler plano pelo caminho de outro projeto', async () => {
            const res = await api(gestorA).get(`/api/projeto/${projetoB.id}/plano-de-acao/${criado.id}`);
            assertStatus(res, 400);
        });

        it('edita a contramedida do próprio plano', async () => {
            const nova = uniq('Nova contramedida');
            assertStatus(
                await api(gestorA).patch(`/api/projeto/${projetoA.id}/plano-de-acao/${criado.id}`).send({ contramedida: nova }),
                200
            );
            const noBanco = await prisma().planoAcao.findUniqueOrThrow({ where: { id: criado.id } });
            assert.equal(noBanco.contramedida, nova);
        });

        it(
            'não edita plano de outro projeto usando o caminho de um projeto que o usuário gerencia',
            async () => {
                const outro = (await api(admin)
                    .post(`/api/projeto/${projetoB.id}/plano-de-acao`)
                    .send(plano({ projeto_risco_id: riscoB.id, contramedida: uniq('De B') }))).body;
                const res = await api(gestorA)
                    .patch(`/api/projeto/${projetoA.id}/plano-de-acao/${outro.id}`)
                    .send({ contramedida: 'Invadido' });
                assertStatus(res, 400);
            }
        );

        it(
            'não remove plano de outro projeto usando o caminho de um projeto que o usuário gerencia',
            async () => {
                const outro = (await api(admin)
                    .post(`/api/projeto/${projetoB.id}/plano-de-acao`)
                    .send(plano({ projeto_risco_id: riscoB.id, contramedida: uniq('De B remover') }))).body;
                assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/plano-de-acao/${outro.id}`), 400);
            }
        );

        it('remove o plano do próprio projeto (202) e depois não lê mais', async () => {
            const descartavel = (await api(gestorA).post(`/api/projeto/${projetoA.id}/plano-de-acao`).send(plano())).body;
            assertStatus(await api(colaboradorFora).delete(`/api/projeto/${projetoA.id}/plano-de-acao/${descartavel.id}`), 400);
            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/plano-de-acao/${descartavel.id}`), 202);
            assertStatus(await api(gestorA).get(`/api/projeto/${projetoA.id}/plano-de-acao/${descartavel.id}`), 400);
        });
    });
});
