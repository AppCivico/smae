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

describe('grupo-portfolio', () => {
    let orgaoA: { id: number };
    let orgaoB: { id: number };
    let admin: Sessao;
    let adminNoOrgaoA: Sessao;
    let semPrivilegio: Sessao;
    let espectador: Sessao;
    let naoEspectador: Sessao;

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        orgaoB = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['CadastroGrupoPortfolio.administrador'], { orgao_id: orgaoA.id });
        adminNoOrgaoA = await criarPessoaComPrivilegios(['CadastroGrupoPortfolio.administrador_no_orgao'], {
            orgao_id: orgaoA.id,
        });
        semPrivilegio = await criarPessoaSemPrivilegios();
        espectador = await criarPessoaComPrivilegios(['SMAE.espectador_de_projeto'], { orgao_id: orgaoA.id });
        naoEspectador = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoA.id });
    });

    describe('autenticação, privilégios e validação', () => {
        it('401 sem token e 403 sem CadastroGrupoPortfolio para criar', async () => {
            assertStatus(await api().get('/api/grupo-portfolio'), 401);
            const res = await api(semPrivilegio)
                .post('/api/grupo-portfolio')
                .send({ titulo: uniq(), participantes: [] });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroGrupoPortfolio\.administrador/);
        });

        it('GET aceita quem só lê projetos (espectador), mas não sem papel', async () => {
            assertStatus(await api(espectador).get('/api/grupo-portfolio'), 200);
            assertStatus(await api(semPrivilegio).get('/api/grupo-portfolio'), 403);
        });

        it('400 sem titulo e com participantes que não são espectadores', async () => {
            assertStatus(await api(admin).post('/api/grupo-portfolio').send({ participantes: [] }), 400);
            const res = await api(admin)
                .post('/api/grupo-portfolio')
                .send({ titulo: uniq(), participantes: [naoEspectador.pessoa.id] });
            assertStatus(res, 400);
            assert.match(res.body.message, /não pode ser participante do grupo/);
        });
    });

    describe('CRUD e órgão', () => {
        let grupo: { id: number };
        let titulo: string;

        before(async () => {
            titulo = uniq('Grupo');
            const res = await api(admin)
                .post('/api/grupo-portfolio')
                .send({ titulo, orgao_id: orgaoA.id, participantes: [espectador.pessoa.id] });
            assertStatus(res, 201);
            grupo = res.body;
        });

        it('lista com os participantes', async () => {
            const lista = await api(espectador).get('/api/grupo-portfolio');
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === grupo.id);
            assert.equal(linha.titulo, titulo);
            assert.ok(linha.participantes.some((p: { id: number }) => p.id === espectador.pessoa.id));
        });

        it('400 com título já usado, sem diferenciar maiúsculas', async () => {
            const res = await api(admin)
                .post('/api/grupo-portfolio')
                .send({ titulo: titulo.toUpperCase(), participantes: [] });
            assertStatus(res, 400);
            assert.match(res.body.message, /Título já está em uso/);
        });

        it('administrador de órgão não cria nem edita fora do próprio órgão', async () => {
            const fora = await api(adminNoOrgaoA)
                .post('/api/grupo-portfolio')
                .send({ titulo: uniq(), orgao_id: orgaoB.id, participantes: [] });
            assertStatus(fora, 400);
            assert.match(fora.body.message, /mesmo órgão/);

            const deOutro = await criarPessoaComPrivilegios(['CadastroGrupoPortfolio.administrador'], { orgao_id: orgaoB.id });
            const grupoB = await api(deOutro)
                .post('/api/grupo-portfolio')
                .send({ titulo: uniq('Do B'), participantes: [] });
            assertStatus(grupoB, 201);
            assertStatus(
                await api(adminNoOrgaoA).patch(`/api/grupo-portfolio/${grupoB.body.id}`).send({ titulo: uniq() }),
                400
            );
            assertStatus(await api(adminNoOrgaoA).delete(`/api/grupo-portfolio/${grupoB.body.id}`), 400);
        });

        it('edita o título e troca participantes', async () => {
            const novo = uniq('Renomeado');
            assertStatus(await api(admin).patch(`/api/grupo-portfolio/${grupo.id}`).send({ titulo: novo, participantes: [] }), 200);
            const lista = await api(admin).get('/api/grupo-portfolio');
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === grupo.id);
            assert.equal(linha.titulo, novo);
            assert.equal(linha.participantes.length, 0);
        });

        it('remove (202) e some da listagem', async () => {
            const descartavel = await api(admin)
                .post('/api/grupo-portfolio')
                .send({ titulo: uniq('Descartável'), participantes: [] });
            assertStatus(await api(admin).delete(`/api/grupo-portfolio/${descartavel.body.id}`), 202);
            const lista = await api(admin).get('/api/grupo-portfolio');
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === descartavel.body.id),
                false
            );
        });
    });

    describe('espectador vê os projetos dos portfólios do grupo', () => {
        let projetoDoGrupo: { id: number };
        let projetoDeFora: { id: number };

        before(async () => {
            const grupo = await api(admin)
                .post('/api/grupo-portfolio')
                .send({ titulo: uniq('Acompanhamento'), orgao_id: orgaoA.id, participantes: [espectador.pessoa.id] });
            assertStatus(grupo, 201);
            const dono = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios'], {
                orgao_id: orgaoA.id,
            });
            const noGrupo = await criarPortfolio(dono, 'PP', {
                orgaos: [orgaoA.id],
                grupo_portfolio: [grupo.body.id],
            });
            const foraDoGrupo = await criarPortfolio(dono, 'PP', { orgaos: [orgaoA.id] });
            projetoDoGrupo = await criarProjeto(dono, 'PP', { portfolio_id: noGrupo.id });
            projetoDeFora = await criarProjeto(dono, 'PP', { portfolio_id: foraDoGrupo.id });
        });

        it('lê o projeto do portfólio do grupo e não o de fora', async () => {
            assertStatus(await api(espectador).get(`/api/projeto/${projetoDoGrupo.id}`), 200);
            assertStatus(await api(espectador).get(`/api/projeto/${projetoDeFora.id}`), 400);
        });
    });
});
