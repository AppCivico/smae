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
import { acao, criarGestorDaObra, criarPortfolio, criarProjeto, lookupsDeObra, ROTA } from './_helpers';

describe('projeto', () => {
    describe('Projetos (PP)', () => {
        let orgaoA: { id: number };
        let orgaoB: { id: number };
        let portfolioAdmin: Sessao;
        let projetoAdmin: Sessao;
        let projetoNoOrgaoB: Sessao;
        let gestor: Sessao;
        let colaborador: Sessao;
        let semPrivilegio: Sessao;
        let portfolioA: { id: number };
        let projetoPrincipal: { id: number };
        let nomePrincipal: string;

        before(async () => {
            await bootApp();
            orgaoA = await criarOrgao();
            orgaoB = await criarOrgao();
            portfolioAdmin = await criarPessoaComPrivilegios(['Projeto.administrar_portfolios'], { orgao_id: orgaoA.id });
            projetoAdmin = await criarPessoaComPrivilegios(['Projeto.administrador'], { orgao_id: orgaoA.id });
            projetoNoOrgaoB = await criarPessoaComPrivilegios(['Projeto.administrador_no_orgao'], { orgao_id: orgaoB.id });
            gestor = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoA.id });
            colaborador = await criarPessoaComPrivilegios(['SMAE.colaborador_de_projeto'], { orgao_id: orgaoA.id });
            semPrivilegio = await criarPessoaSemPrivilegios();
            portfolioA = await criarPortfolio(portfolioAdmin, 'PP', { orgaos: [orgaoA.id] });
        });

        describe('autenticação e privilégios', () => {
            it('401 sem token', async () => {
                assertStatus(await api().get('/api/projeto'), 401);
                assertStatus(await api().post('/api/projeto').send({}), 401);
            });

            it('403 sem papel de projeto', async () => {
                assertStatus(await api(semPrivilegio).get('/api/projeto'), 403);
            });

            it('403 ao criar com só SMAE.gestor_de_projeto (criar exige administrador)', async () => {
                const res = await api(gestor)
                    .post('/api/projeto')
                    .send({ nome: uniq(), portfolio_id: portfolioA.id, orgao_gestor_id: orgaoA.id });
                assertStatus(res, 403);
                assert.match(res.body.message, /Projeto\.administrador/);
            });

            it('header smae-sistemas=MDO tira os privilégios de Projetos: 400 "não tem mais permissões"', async () => {
                const res = await api(projetoAdmin, { sistema: 'MDO' }).get('/api/projeto');
                assertStatus(res, 400);
                assert.match(res.body.message, /não tem mais permissões/);
            });
        });

        describe('validação', () => {
            it('400 sem nome e com origem_tipo inválida', async () => {
                const base = { portfolio_id: portfolioA.id, orgao_gestor_id: orgaoA.id };
                assertStatus(
                    await api(projetoAdmin).post('/api/projeto').send({ ...base, origem_tipo: 'Outro', origem_outro: 'x' }),
                    400
                );
                assertStatus(
                    await api(projetoAdmin)
                        .post('/api/projeto')
                        .send({ ...base, nome: uniq(), origem_tipo: 'Inventada', origem_outro: 'x' }),
                    400
                );
            });

            it('400 ao criar origem Outro sem origem_outro', async () => {
                const res = await api(projetoAdmin).post('/api/projeto').send({
                    nome: uniq(),
                    portfolio_id: portfolioA.id,
                    orgao_gestor_id: orgaoA.id,
                    origem_tipo: 'Outro',
                    responsaveis_no_orgao_gestor: [],
                    orgaos_participantes: [],
                    previsao_custo: null,
                });
                assertStatus(res, 400);
                assert.match(res.body.message, /Deve ser enviado quando origem_tipo for Outro/);
            });

            it('400 com :id não numérico', async () => {
                assertStatus(await api(projetoAdmin).get('/api/projeto/abc'), 400);
            });
        });

        describe('criação e listagem', () => {
            it('cria em Registrado, sem código, e lê de volta', async () => {
                nomePrincipal = uniq('Escola');
                projetoPrincipal = await criarProjeto(projetoAdmin, 'PP', {
                    portfolio_id: portfolioA.id,
                    nome: nomePrincipal,
                    orgao_responsavel_id: orgaoA.id,
                });

                const lido = await api(projetoAdmin).get(`/api/projeto/${projetoPrincipal.id}`);
                assertStatus(lido, 200);
                assert.equal(lido.body.nome, nomePrincipal);
                assert.equal(lido.body.status, 'Registrado');
                assert.equal(lido.body.codigo, null);
                assert.equal(lido.body.portfolio_id, portfolioA.id);
                assert.equal(lido.body.permissoes.acao_selecionar, true);
                assert.equal(lido.body.permissoes.acao_iniciar_planejamento, false);
            });

            it('400 ao criar em portfólio que o órgão não vê', async () => {
                const res = await api(projetoNoOrgaoB).post('/api/projeto').send({
                    nome: uniq(),
                    portfolio_id: portfolioA.id,
                    orgao_gestor_id: orgaoB.id,
                    origem_tipo: 'Outro',
                    origem_outro: 'x',
                    responsaveis_no_orgao_gestor: [],
                    orgaos_participantes: [],
                    previsao_custo: null,
                });
                assertStatus(res, 400);
                assert.match(res.body.message, /Portfolio não está liberado/);
            });

            it('400 quando o órgão gestor não faz parte do portfólio', async () => {
                const res = await api(projetoAdmin).post('/api/projeto').send({
                    nome: uniq(),
                    portfolio_id: portfolioA.id,
                    orgao_gestor_id: orgaoB.id,
                    origem_tipo: 'Outro',
                    origem_outro: 'x',
                    responsaveis_no_orgao_gestor: [],
                    orgaos_participantes: [],
                    previsao_custo: null,
                });
                assertStatus(res, 400);
                assert.match(res.body.message, /Órgão não faz parte do Portfolio/);
            });

            it('lista por portfólio e mostra o projeto criado', async () => {
                const lista = await api(projetoAdmin).get(`/api/projeto?portfolio_id=${portfolioA.id}`);
                assertStatus(lista, 200);
                const linha = lista.body.linhas.find((l: { id: number }) => l.id === projetoPrincipal.id);
                assert.ok(linha, 'projeto criado não aparece na listagem do portfólio');
                assert.equal(linha.nome, nomePrincipal);
            });
        });

        describe('transições de status (projeto-acao e PATCH)', () => {
            it('400 ao iniciar planejamento antes de selecionar', async () => {
                const res = await acao(projetoAdmin, 'PP', projetoPrincipal.id, 'iniciar_planejamento');
                assertStatus(res, 400);
                assert.match(res.body.message, /Não é possível executar ação iniciar_planejamento/);
            });

            it('seleção grava selecionado_em, iniciar planejamento gera o código', async () => {
                assertStatus(await acao(projetoAdmin, 'PP', projetoPrincipal.id, 'selecionar'), 204);
                const selecionado = await api(projetoAdmin).get(`/api/projeto/${projetoPrincipal.id}`);
                assert.equal(selecionado.body.status, 'Selecionado');
                const noBanco = await prisma().projeto.findUniqueOrThrow({ where: { id: projetoPrincipal.id } });
                assert.ok(noBanco.selecionado_em);
                assert.equal(noBanco.eh_prioritario, true);

                assertStatus(await acao(projetoAdmin, 'PP', projetoPrincipal.id, 'iniciar_planejamento'), 204);
                const emPlanejamento = await api(projetoAdmin).get(`/api/projeto/${projetoPrincipal.id}`);
                assert.equal(emPlanejamento.body.status, 'EmPlanejamento');
                assert.ok(typeof emPlanejamento.body.codigo === 'string' && emPlanejamento.body.codigo.length > 0);
            });

            it('PATCH de status só retrocede: avançar para EmAcompanhamento é 400', async () => {
                const res = await api(projetoAdmin)
                    .patch(`/api/projeto/${projetoPrincipal.id}`)
                    .send({ status: 'EmAcompanhamento' });
                assertStatus(res, 400);
                assert.match(res.body.message, /Você não é possível mudar o status/);
            });

            it('status de obra não entra em projeto de Projetos (400)', async () => {
                const res = await api(projetoAdmin)
                    .patch(`/api/projeto/${projetoPrincipal.id}`)
                    .send({ status: 'MDO_Concluida' });
                assertStatus(res, 400);
                assert.match(res.body.message, /Status inválido para Projetos/);
            });

            it('create ignora o status enviado: projeto de Projetos sempre nasce Registrado', async () => {
                const criado = await api(projetoAdmin).post('/api/projeto').send({
                    nome: uniq(),
                    portfolio_id: portfolioA.id,
                    orgao_gestor_id: orgaoA.id,
                    origem_tipo: 'Outro',
                    origem_outro: 'x',
                    status: 'Selecionado',
                    responsaveis_no_orgao_gestor: [],
                    orgaos_participantes: [],
                    previsao_custo: null,
                });
                assertStatus(criado, 201);
                const lido = await api(projetoAdmin).get(`/api/projeto/${criado.body.id}`);
                assert.equal(lido.body.status, 'Registrado');
            });

            it('PATCH de status para trás (EmPlanejamento -> Registrado) é aceito', async () => {
                assertStatus(
                    await api(projetoAdmin).patch(`/api/projeto/${projetoPrincipal.id}`).send({ status: 'Registrado' }),
                    200
                );
                const lido = await api(projetoAdmin).get(`/api/projeto/${projetoPrincipal.id}`);
                assert.equal(lido.body.status, 'Registrado');
            });
        });

        describe('visibilidade por órgão, gestor e colaborador', () => {
            let projetoGestor: { id: number };
            let projetoColaborador: { id: number };

            before(async () => {
                projetoGestor = await criarProjeto(projetoAdmin, 'PP', {
                    portfolio_id: portfolioA.id,
                    responsaveis_no_orgao_gestor: [gestor.pessoa.id],
                });
                projetoColaborador = await criarProjeto(projetoAdmin, 'PP', {
                    portfolio_id: portfolioA.id,
                    responsavel_id: colaborador.pessoa.id,
                });
            });

            it('órgão de fora do portfólio não lê o projeto (400) nem o vê na listagem', async () => {
                const lido = await api(projetoNoOrgaoB).get(`/api/projeto/${projetoPrincipal.id}`);
                assertStatus(lido, 400);
                assert.match(lido.body.message, /sem permissão para acesso/);

                const lista = await api(projetoNoOrgaoB).get(`/api/projeto?portfolio_id=${portfolioA.id}`);
                assertStatus(lista, 200);
                assert.equal(
                    lista.body.linhas.some((l: { id: number }) => l.id === projetoPrincipal.id),
                    false
                );
            });

            it('gestor só lê os projetos em que está em responsaveis_no_orgao_gestor', async () => {
                assertStatus(await api(gestor).get(`/api/projeto/${projetoGestor.id}`), 200);
                assertStatus(await api(gestor).get(`/api/projeto/${projetoPrincipal.id}`), 400);
            });

            it('colaborador responsável escreve na planejamento, mas não depois dela', async () => {
                const ok = await api(colaborador)
                    .patch(`/api/projeto/${projetoColaborador.id}`)
                    .send({ nome: uniq('Renomeado') });
                assertStatus(ok, 200);

                await prisma().projeto.update({
                    where: { id: projetoColaborador.id },
                    data: { status: 'EmAcompanhamento' },
                });
                const bloqueado = await api(colaborador)
                    .patch(`/api/projeto/${projetoColaborador.id}`)
                    .send({ nome: uniq('Tarde') });
                assertStatus(bloqueado, 400);
                assert.match(bloqueado.body.message, /Você não tem permissão para editar este projeto/);
            });

            it('ids respeita a mesma visibilidade', async () => {
                const comoAdmin = await api(projetoAdmin).get(`/api/projeto/ids?portfolio_id=${portfolioA.id}`);
                assertStatus(comoAdmin, 200);
                assert.ok(comoAdmin.body.ids.includes(projetoPrincipal.id));

                const comoOutro = await api(projetoNoOrgaoB).get(`/api/projeto/ids?portfolio_id=${portfolioA.id}`);
                assert.equal(comoOutro.body.ids.includes(projetoPrincipal.id), false);
            });
        });

        describe('remoção e isolamento de tipo', () => {
            it('remove (soft delete) só quem enxerga o projeto; depois ele some', async () => {
                const descartavel = await criarProjeto(projetoAdmin, 'PP', { portfolio_id: portfolioA.id });

                assertStatus(await api(projetoNoOrgaoB).delete(`/api/projeto/${descartavel.id}`), 400);
                assertStatus(await api(projetoAdmin).delete(`/api/projeto/${descartavel.id}`), 202);

                const noBanco = await prisma().projeto.findUniqueOrThrow({ where: { id: descartavel.id } });
                assert.ok(noBanco.removido_em);
                assertStatus(await api(projetoAdmin).get(`/api/projeto/${descartavel.id}`), 400);
            });

            it('projeto de Projetos não é lido pela rota de obras (403 pela guarda)', async () => {
                assertStatus(await api(projetoAdmin).get(`${ROTA.MDO.projeto}/${projetoPrincipal.id}`), 403);
            });
        });
    });

    describe('Obras (MDO)', () => {
        let orgaoA: { id: number };
        let orgaoSemGestor: { id: number };
        let adminMdo: Sessao;
        let adminMdoOrgaoB: Sessao;
        let gestorObraA: Sessao;
        let portfolioMdo: { id: number };
        let obra: { id: number };
        let orgaoB: { id: number };

        before(async () => {
            await bootApp();
            orgaoA = await criarOrgao();
            orgaoB = await criarOrgao();
            orgaoSemGestor = await criarOrgao();
            adminMdo = await criarPessoaComPrivilegios(['ProjetoMDO.administrador_no_orgao'], { orgao_id: orgaoA.id });
            adminMdoOrgaoB = await criarPessoaComPrivilegios(['ProjetoMDO.administrador_no_orgao'], {
                orgao_id: orgaoB.id,
            });
            gestorObraA = await criarGestorDaObra(orgaoA.id);
            const portfolioAdminMdo = await criarPessoaComPrivilegios(['ProjetoMDO.administrar_portfolios'], {
                orgao_id: orgaoA.id,
            });
            portfolioMdo = await criarPortfolio(portfolioAdminMdo, 'MDO', {
                orgaos: [orgaoA.id, orgaoSemGestor.id],
            });
        });

        it('401 sem token e 403 sem papel de obra', async () => {
            assertStatus(await api().get(ROTA.MDO.projeto), 401);
            assertStatus(await api(await criarPessoaSemPrivilegios()).get(ROTA.MDO.projeto), 403);
        });

        it('403 para ProjetoMDO.administrador: criar obra exige administrador_no_orgao', async () => {
            const globalMdo = await criarPessoaComPrivilegios(['ProjetoMDO.administrador'], { orgao_id: orgaoA.id });
            const res = await api(globalMdo).post(ROTA.MDO.projeto).send({
                nome: uniq(),
                portfolio_id: portfolioMdo.id,
                orgao_gestor_id: orgaoA.id,
            });
            assertStatus(res, 403);
        });

        it('400 sem orgao_origem, grupo temático e tipo de intervenção', async () => {
            const res = await api(adminMdo).post(ROTA.MDO.projeto).send({
                nome: uniq(),
                portfolio_id: portfolioMdo.id,
                orgao_gestor_id: orgaoA.id,
                origem_tipo: 'Outro',
                origem_outro: 'x',
                responsaveis_no_orgao_gestor: [],
                orgaos_participantes: [],
                previsao_custo: null,
            });
            assertStatus(res, 400);
            assert.match(res.body.message, /Campo obrigatório para obras/);
        });

        it('400 quando o órgão gestor não tem Gestor(a) da Obra', async () => {
            const sessaoSemGestor = await criarPessoaComPrivilegios(['ProjetoMDO.administrador_no_orgao'], {
                orgao_id: orgaoSemGestor.id,
            });
            const res = await api(sessaoSemGestor).post(ROTA.MDO.projeto).send({
                nome: uniq(),
                portfolio_id: portfolioMdo.id,
                orgao_gestor_id: orgaoSemGestor.id,
                origem_tipo: 'Outro',
                origem_outro: 'x',
                responsaveis_no_orgao_gestor: [],
                orgaos_participantes: [],
                previsao_custo: null,
                orgao_origem_id: orgaoSemGestor.id,
                ...(await lookupsDeObra()),
            });
            assertStatus(res, 400);
            assert.match(res.body.message, /Órgão não possui usuários com o perfil/);
        });

        it('cria obra em NaoIniciada e lê de volta', async () => {
            obra = await criarProjeto(adminMdo, 'MDO', { portfolio_id: portfolioMdo.id, nome: uniq('UBS') });
            const lido = await api(adminMdo).get(`${ROTA.MDO.projeto}/${obra.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.status, 'MDO_NaoIniciada');
            assert.equal(lido.body.permissoes.acao_iniciar_obra, true);
        });

        it('ações de obra mudam o status; status de Projetos não entra numa obra', async () => {
            assertStatus(await acao(adminMdo, 'MDO', obra.id, 'iniciar_obra'), 204);
            assert.equal((await api(adminMdo).get(`${ROTA.MDO.projeto}/${obra.id}`)).body.status, 'MDO_EmAndamento');

            assertStatus(await acao(adminMdo, 'MDO', obra.id, 'concluir_obra'), 204);
            assert.equal((await api(adminMdo).get(`${ROTA.MDO.projeto}/${obra.id}`)).body.status, 'MDO_Concluida');

            assertStatus(
                await api(adminMdo).patch(`${ROTA.MDO.projeto}/${obra.id}`).send({ status: 'MDO_NaoIniciada' }),
                200
            );
            const deProjetos = await api(adminMdo).patch(`${ROTA.MDO.projeto}/${obra.id}`).send({ status: 'Registrado' });
            assertStatus(deProjetos, 400);
            assert.match(deProjetos.body.message, /Status inválido para Obras/);
        });

        it('órgão de fora do portfólio não lê a obra nem a vê na listagem', async () => {
            const lido = await api(adminMdoOrgaoB).get(`${ROTA.MDO.projeto}/${obra.id}`);
            assertStatus(lido, 400);
            assert.match(lido.body.message, /sem permissão para acesso/);

            const lista = await api(adminMdoOrgaoB).get(`${ROTA.MDO.projeto}?portfolio_id=${portfolioMdo.id}`);
            assertStatus(lista, 200);
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === obra.id),
                false
            );
        });

        it('gestor de obra do órgão do portfólio lê a obra (ProjetoMDO.administrador_no_orgao)', async () => {
            assertStatus(await api(gestorObraA).get(`${ROTA.MDO.projeto}/${obra.id}`), 200);
        });

        it('projeto de Projetos e obra não se leem pela rota do outro tipo', async () => {
            const admPP = await criarPessoaComPrivilegios(
                ['Projeto.administrador', 'Projeto.administrar_portfolios'],
                { orgao_id: orgaoA.id }
            );
            const portPP = await criarPortfolio(admPP, 'PP', { orgaos: [orgaoA.id] });
            const projetoPP = await criarProjeto(admPP, 'PP', { portfolio_id: portPP.id });

            assertStatus(await api(adminMdo).get(`${ROTA.MDO.projeto}/${projetoPP.id}`), 400);
            assertStatus(await api(admPP).get(`${ROTA.PP.projeto}/${obra.id}`), 400);
        });

        it('header smae-sistemas=Projetos tira os privilégios de obras: 400', async () => {
            const res = await api(adminMdo, { sistema: 'Projetos' }).get(ROTA.MDO.projeto);
            assertStatus(res, 400);
            assert.match(res.body.message, /não tem mais permissões/);
        });
    });
});
