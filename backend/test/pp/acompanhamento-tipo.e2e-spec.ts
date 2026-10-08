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

describe('acompanhamento-tipo', () => {
    let orgaoA: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let semPrivilegio: Sessao;
    let adminMdo: Sessao;

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['Projeto.administrador'], { orgao_id: orgaoA.id });
        gestorA = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoA.id });
        semPrivilegio = await criarPessoaSemPrivilegios();
        adminMdo = await criarPessoaComPrivilegios(['ProjetoMDO.administrador_no_orgao'], { orgao_id: orgaoA.id });
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/acompanhamento-tipo'), 401);
            assertStatus(await api().post('/api/acompanhamento-tipo').send({ nome: uniq() }), 401);
        });

        it('GET aceita leitura de projeto; POST exige administrador de projeto', async () => {
            assertStatus(await api(gestorA).get('/api/acompanhamento-tipo'), 200);
            const res = await api(gestorA).post('/api/acompanhamento-tipo').send({ nome: uniq() });
            assertStatus(res, 403);
            assert.match(res.body.message, /Projeto\.administrador/);
        });

        it('403 para quem não tem papel nenhum de projeto', async () => {
            assertStatus(await api(semPrivilegio).get('/api/acompanhamento-tipo'), 403);
        });
    });

    describe('validação', () => {
        it('400 sem nome', async () => {
            assertStatus(await api(admin).post('/api/acompanhamento-tipo').send({}), 400);
        });
    });

    describe('CRUD de Projetos', () => {
        let tipo: { id: number };

        before(async () => {
            const res = await api(admin).post('/api/acompanhamento-tipo').send({ nome: uniq('Reunião') });
            assertStatus(res, 201);
            tipo = res.body;
        });

        it('lista o tipo criado', async () => {
            const lista = await api(gestorA).get('/api/acompanhamento-tipo');
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === tipo.id));
        });

        it('400 com nome igual ao de um tipo ativo', async () => {
            const nome = uniq('Comitê');
            assertStatus(await api(admin).post('/api/acompanhamento-tipo').send({ nome }), 201);
            const dup = await api(admin).post('/api/acompanhamento-tipo').send({ nome });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Já existe um tipo de acompanhamento/);
        });

        it('edita o nome (a rota responde 202)', async () => {
            const novo = uniq('Visita técnica');
            assertStatus(await api(admin).patch(`/api/acompanhamento-tipo/${tipo.id}`).send({ nome: novo }), 202);
            const lista = await api(admin).get('/api/acompanhamento-tipo');
            assert.equal(lista.body.linhas.find((l: { id: number }) => l.id === tipo.id).nome, novo);
        });

        it('remove (202) e some da listagem', async () => {
            const descartavel = await api(admin).post('/api/acompanhamento-tipo').send({ nome: uniq('Descartável') });
            assertStatus(await api(admin).delete(`/api/acompanhamento-tipo/${descartavel.body.id}`), 202);
            const lista = await api(admin).get('/api/acompanhamento-tipo');
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === descartavel.body.id),
                false
            );
        });
    });

    describe('tipo em uso por acompanhamento', () => {
        it('não remove tipo associado a acompanhamento de projeto (400)', async () => {
            const portfolio = await criarPortfolio(
                await criarPessoaComPrivilegios(['Projeto.administrar_portfolios'], { orgao_id: orgaoA.id }),
                'PP',
                { orgaos: [orgaoA.id] }
            );
            const projeto = await criarProjeto(admin, 'PP', {
                portfolio_id: portfolio.id,
                responsaveis_no_orgao_gestor: [gestorA.pessoa.id],
            });
            const tipo = (await api(admin).post('/api/acompanhamento-tipo').send({ nome: uniq('Em uso') })).body;
            const acomp = await api(gestorA).post(`/api/projeto/${projeto.id}/acompanhamento`).send({
                data_registro: '2026-04-01',
                participantes: 'Equipe',
                acompanhamento_tipo_id: tipo.id,
            });
            assertStatus(acomp, 201);

            const res = await api(admin).delete(`/api/acompanhamento-tipo/${tipo.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /associado à um projeto/);
        });
    });

    describe('Obras (acompanhamento-tipo-mdo)', () => {
        it('tipo de obra não aparece na lista de Projetos e vice-versa', async () => {
            const tipoObra = await api(adminMdo).post('/api/acompanhamento-tipo-mdo').send({ nome: uniq('Obra') });
            assertStatus(tipoObra, 201);

            const listaPP = await api(admin).get('/api/acompanhamento-tipo');
            assert.equal(
                listaPP.body.linhas.some((l: { id: number }) => l.id === tipoObra.body.id),
                false
            );
            const listaMdo = await api(adminMdo).get('/api/acompanhamento-tipo-mdo');
            assert.ok(listaMdo.body.linhas.some((l: { id: number }) => l.id === tipoObra.body.id));
        });

        it('403 ao criar tipo de obra com só Projeto.administrador', async () => {
            assertStatus(await api(admin).post('/api/acompanhamento-tipo-mdo').send({ nome: uniq() }), 403);
        });
    });
});
