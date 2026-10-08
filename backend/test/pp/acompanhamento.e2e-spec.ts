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
import { cenarioObras, criarPortfolio, criarProjeto } from './_helpers';

describe('projeto-acompanhamento', () => {
    let orgaoA: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let colaboradorFora: Sessao;
    let semPrivilegio: Sessao;
    let projetoA: { id: number };
    let riscoA: { id: number };
    let tipo: { id: number };

    const acompanhamento = (dados: Record<string, unknown> = {}) => ({
        data_registro: '2026-04-10',
        participantes: 'Equipe do projeto',
        acompanhamento_tipo_id: tipo.id,
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
        tipo = (await api(admin).post('/api/acompanhamento-tipo').send({ nome: uniq('Tipo') })).body;
        const portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
        projetoA = await criarProjeto(admin, 'PP', {
            portfolio_id: portfolio.id,
            responsaveis_no_orgao_gestor: [gestorA.pessoa.id],
        });
        riscoA = (
            await api(gestorA).post(`/api/projeto/${projetoA.id}/risco`).send({
                titulo: uniq('Risco'),
                registrado_em: '2026-03-10',
                probabilidade: 3,
                impacto: 3,
            })
        ).body;
    });

    describe('autenticação e validação', () => {
        it('401 sem token, 403 sem papel, 400 para quem não enxerga o projeto', async () => {
            assertStatus(await api().get(`/api/projeto/${projetoA.id}/acompanhamento`), 401);
            assertStatus(
                await api(semPrivilegio).post(`/api/projeto/${projetoA.id}/acompanhamento`).send(acompanhamento()),
                403
            );
            const fora = await api(colaboradorFora).post(`/api/projeto/${projetoA.id}/acompanhamento`).send(acompanhamento());
            assertStatus(fora, 400);
            assert.match(fora.body.message, /sem permissão para acesso/);
        });

        it('400 sem participantes e com data_registro inválida', async () => {
            assertStatus(
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/acompanhamento`)
                    .send({ data_registro: '2026-04-10', acompanhamento_tipo_id: tipo.id }),
                400
            );
            assertStatus(
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/acompanhamento`)
                    .send(acompanhamento({ data_registro: 'hoje' })),
                400
            );
        });
    });

    describe('criação e leitura', () => {
        let criado: { id: number };

        before(async () => {
            const res = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/acompanhamento`)
                .send(
                    acompanhamento({
                        pauta: '<script>x()</script>Pauta do mês',
                        detalhamento: 'Detalhe',
                        acompanhamentos: [{ encaminhamento: 'Enviar ofício', responsavel: 'Fulano' }],
                        risco: [riscoA.id],
                    })
                );
            assertStatus(res, 201);
            criado = res.body;
        });

        it('lista e lê o acompanhamento com encaminhamentos', async () => {
            const lista = await api(gestorA).get(`/api/projeto/${projetoA.id}/acompanhamento`);
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === criado.id));

            const lido = await api(gestorA).get(`/api/projeto/${projetoA.id}/acompanhamento/${criado.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.participantes, 'Equipe do projeto');
            assert.equal(lido.body.acompanhamento_tipo.id, tipo.id);
        });

        it('sanitiza HTML da pauta e vincula o risco', async () => {
            const noBanco = await prisma().projetoAcompanhamento.findUniqueOrThrow({ where: { id: criado.id } });
            assert.doesNotMatch(noBanco.pauta ?? '', /<script/);
            assert.match(noBanco.pauta ?? '', /Pauta do mês/);

            const riscos = await prisma().projetoAcompanhamentoRisco.count({
                where: { projeto_acompanhamento_id: criado.id, projeto_risco_id: riscoA.id },
            });
            assert.equal(riscos, 1);
        });

        it('400 ao ler acompanhamento pelo caminho de outro projeto', async () => {
            const outro = await criarProjeto(admin, 'PP', {
                portfolio_id: (await prisma().projeto.findUniqueOrThrow({ where: { id: projetoA.id } })).portfolio_id,
            });
            const res = await api(admin).get(`/api/projeto/${outro.id}/acompanhamento/${criado.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /Não foi possível encontrar o Acompanhamento/);
        });
    });

    describe('regras de negócio', () => {
        it('só um acompanhamento por projeto fica marcado para o relatório', async () => {
            const primeiro = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/acompanhamento`)
                .send(acompanhamento({ apresentar_no_relatorio: true }));
            assertStatus(primeiro, 201);
            const segundo = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/acompanhamento`)
                .send(acompanhamento({ apresentar_no_relatorio: true }));
            assertStatus(segundo, 201);

            const p = await prisma().projetoAcompanhamento.findUniqueOrThrow({ where: { id: primeiro.body.id } });
            const s = await prisma().projetoAcompanhamento.findUniqueOrThrow({ where: { id: segundo.body.id } });
            assert.equal(p.apresentar_no_relatorio, false);
            assert.equal(s.apresentar_no_relatorio, true);
        });

        it('edita o participantes do próprio acompanhamento', async () => {
            const criado = await api(gestorA).post(`/api/projeto/${projetoA.id}/acompanhamento`).send(acompanhamento());
            assertStatus(
                await api(gestorA)
                    .patch(`/api/projeto/${projetoA.id}/acompanhamento/${criado.body.id}`)
                    .send({ participantes: 'Novo grupo' }),
                200
            );
            const noBanco = await prisma().projetoAcompanhamento.findUniqueOrThrow({ where: { id: criado.body.id } });
            assert.equal(noBanco.participantes, 'Novo grupo');
        });

        it('remove o acompanhamento (202) e depois não lê mais', async () => {
            const criado = await api(gestorA).post(`/api/projeto/${projetoA.id}/acompanhamento`).send(acompanhamento());
            assertStatus(await api(colaboradorFora).delete(`/api/projeto/${projetoA.id}/acompanhamento/${criado.body.id}`), 400);
            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/acompanhamento/${criado.body.id}`), 202);
            assertStatus(await api(gestorA).get(`/api/projeto/${projetoA.id}/acompanhamento/${criado.body.id}`), 400);
        });

        it('400 ao vincular risco em acompanhamento de obra (só Projetos tem riscos)', async () => {
            const obras = await cenarioObras();
            const obra = await criarProjeto(obras.adminMdo, 'MDO', { portfolio_id: obras.portfolio.id });
            const res = await api(obras.adminMdo)
                .post(`/api/projeto-mdo/${obra.id}/acompanhamento`)
                .send(acompanhamento({ risco: [riscoA.id] }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Apenas Gestão de Projetos podem ter riscos/);
        });
    });
});
