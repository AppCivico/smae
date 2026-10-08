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

describe('projeto-risco', () => {
    let orgaoA: { id: number };
    let orgaoB: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let colaboradorFora: Sessao;
    let semPrivilegio: Sessao;
    let adminOrgaoB: Sessao;
    let portfolioA: { id: number };
    let projetoA: { id: number };
    let projetoB: { id: number };

    const risco = (dados: Record<string, unknown> = {}) => ({
        titulo: uniq('Risco'),
        registrado_em: '2026-03-10',
        probabilidade: 4,
        impacto: 4,
        ...dados,
    });

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        orgaoB = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios'], {
            orgao_id: orgaoA.id,
        });
        gestorA = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoA.id });
        colaboradorFora = await criarPessoaComPrivilegios(['SMAE.colaborador_de_projeto'], { orgao_id: orgaoA.id });
        semPrivilegio = await criarPessoaSemPrivilegios();
        adminOrgaoB = await criarPessoaComPrivilegios(['Projeto.administrador_no_orgao'], { orgao_id: orgaoB.id });
        portfolioA = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
        projetoA = await criarProjeto(admin, 'PP', {
            portfolio_id: portfolioA.id,
            responsaveis_no_orgao_gestor: [gestorA.pessoa.id],
        });
        projetoB = await criarProjeto(admin, 'PP', { portfolio_id: portfolioA.id });
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get(`/api/projeto/${projetoA.id}/risco`), 401);
            assertStatus(await api().post(`/api/projeto/${projetoA.id}/risco`).send(risco()), 401);
        });

        it('403 sem papel de projeto', async () => {
            const res = await api(semPrivilegio).post(`/api/projeto/${projetoA.id}/risco`).send(risco());
            assertStatus(res, 403);
        });

        it('400 para colaborador fora da equipe, que nem enxerga o projeto', async () => {
            const res = await api(colaboradorFora).post(`/api/projeto/${projetoA.id}/risco`).send(risco());
            assertStatus(res, 400);
            assert.match(res.body.message, /sem permissão para acesso/);
        });

        it('400 para órgão que não vê o projeto', async () => {
            const res = await api(adminOrgaoB).post(`/api/projeto/${projetoA.id}/risco`).send(risco());
            assertStatus(res, 400);
            assert.match(res.body.message, /sem permissão para acesso/);
        });
    });

    describe('validação', () => {
        it('400 sem titulo e com :id não numérico', async () => {
            assertStatus(
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/risco`)
                    .send({ registrado_em: '2026-03-10', probabilidade: 1, impacto: 1 }),
                400
            );
            assertStatus(await api(gestorA).get(`/api/projeto/abc/risco`), 400);
        });
    });

    describe('criação e cálculo', () => {
        let primeiro: { id: number };

        it('cria com nível, grau e resposta calculados e código 1', async () => {
            const res = await api(gestorA).post(`/api/projeto/${projetoA.id}/risco`).send(risco());
            assertStatus(res, 201);
            primeiro = res.body;

            const noBanco = await prisma().projetoRisco.findUniqueOrThrow({ where: { id: primeiro.id } });
            assert.equal(noBanco.codigo, 1);
            assert.equal(noBanco.nivel, 16);
            assert.equal(noBanco.grau, 4);
            assert.equal(noBanco.resposta, 'Eliminar');
        });

        it('o código segue a sequência do projeto', async () => {
            const res = await api(gestorA).post(`/api/projeto/${projetoA.id}/risco`).send(risco());
            assertStatus(res, 201);
            const noBanco = await prisma().projetoRisco.findUniqueOrThrow({ where: { id: res.body.id } });
            assert.equal(noBanco.codigo, 2);
        });

        it('sanitiza HTML da descrição antes de gravar', async () => {
            const res = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/risco`)
                .send(risco({ descricao: '<script>alert(1)</script>Atraso no fornecedor' }));
            assertStatus(res, 201);
            const noBanco = await prisma().projetoRisco.findUniqueOrThrow({ where: { id: res.body.id } });
            assert.doesNotMatch(noBanco.descricao ?? '', /<script/);
            assert.match(noBanco.descricao ?? '', /Atraso no fornecedor/);
        });

        it('projeto em portfólio de modelo de clonagem não recebe riscos (400)', async () => {
            const modelo = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id], modelo_clonagem: true });
            const projetoModelo = await criarProjeto(admin, 'PP', { portfolio_id: modelo.id });
            const res = await api(admin).post(`/api/projeto/${projetoModelo.id}/risco`).send(risco());
            assertStatus(res, 400);
            assert.match(res.body.message, /modelo de clonagem/);
        });
    });

    describe('leitura e escopo por projeto', () => {
        let riscoDoA: { id: number };
        let riscoDoB: { id: number };

        before(async () => {
            riscoDoA = (await api(gestorA).post(`/api/projeto/${projetoA.id}/risco`).send(risco({ titulo: 'Do A' }))).body;
            riscoDoB = (await api(admin).post(`/api/projeto/${projetoB.id}/risco`).send(risco({ titulo: 'Do B' }))).body;
        });

        it('lista só os riscos do projeto e lê um deles', async () => {
            const lista = await api(gestorA).get(`/api/projeto/${projetoA.id}/risco`);
            assertStatus(lista, 200);
            const titulos = lista.body.linhas.map((l: { titulo: string }) => l.titulo);
            assert.ok(titulos.includes('Do A'));
            assert.equal(titulos.includes('Do B'), false);

            const lido = await api(gestorA).get(`/api/projeto/${projetoA.id}/risco/${riscoDoA.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.titulo, 'Do A');
        });

        it('400 ao ler risco de outro projeto pelo caminho do projeto errado', async () => {
            const res = await api(gestorA).get(`/api/projeto/${projetoA.id}/risco/${riscoDoB.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /Não foi possível encontrar o Risco/);
        });

        it('edita o título do próprio risco', async () => {
            assertStatus(
                await api(gestorA).patch(`/api/projeto/${projetoA.id}/risco/${riscoDoA.id}`).send({ titulo: 'Editado' }),
                200
            );
            const lido = await api(gestorA).get(`/api/projeto/${projetoA.id}/risco/${riscoDoA.id}`);
            assert.equal(lido.body.titulo, 'Editado');
        });

        it(
            'não edita risco de outro projeto usando o caminho de um projeto que o usuário gerencia',
            {
                todo: 'BUG: PATCH /api/projeto/:id/risco/:id2 checa a permissão do projeto :id, mas RiscoService.update busca o risco só por id (sem projeto_id), então um risco de outro projeto é alterado',
            },
            async () => {
                const res = await api(gestorA)
                    .patch(`/api/projeto/${projetoA.id}/risco/${riscoDoB.id}`)
                    .send({ titulo: 'Invadido' });
                assertStatus(res, 400);
                const noBanco = await prisma().projetoRisco.findUniqueOrThrow({ where: { id: riscoDoB.id } });
                assert.notEqual(noBanco.titulo, 'Invadido');
            }
        );

        it('remove só quem faz parte da equipe e some depois', async () => {
            const descartavel = (await api(gestorA).post(`/api/projeto/${projetoA.id}/risco`).send(risco())).body;

            assertStatus(await api(colaboradorFora).delete(`/api/projeto/${projetoA.id}/risco/${descartavel.id}`), 400);
            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/risco/${descartavel.id}`), 202);
            assertStatus(await api(gestorA).get(`/api/projeto/${projetoA.id}/risco/${descartavel.id}`), 400);
        });
    });
});
