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
import { criarPortfolio, criarProjeto } from '../pp/_helpers';

describe('painel-estrategico', () => {
    let orgaoA: { id: number };
    let orgaoB: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let semPrivilegio: Sessao;
    let portfolioA: { id: number };
    let projetoA: { id: number };

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        orgaoB = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios'], {
            orgao_id: orgaoA.id,
        });
        gestorA = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoA.id });
        semPrivilegio = await criarPessoaSemPrivilegios();
        portfolioA = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
        projetoA = await criarProjeto(admin, 'PP', {
            portfolio_id: portfolioA.id,
            nome: uniq('Painel'),
            responsaveis_no_orgao_gestor: [gestorA.pessoa.id],
        });
        // o painel lê uma view materializada que só é atualizada por job (crons desligados nos testes)
        await prisma().$executeRawUnsafe('REFRESH MATERIALIZED VIEW view_painel_estrategico_projeto');
    });

    it('401 sem token e 403 sem papel de projeto', async () => {
        assertStatus(await api().post('/api/painel-estrategico').send({}), 401);
        assertStatus(await api(semPrivilegio).post('/api/painel-estrategico').send({}), 403);
    });

    it('resumo do painel traz os agregados', async () => {
        const res = await api(gestorA).post('/api/painel-estrategico').send({});
        assertStatus(res, 201);
        assert.ok(Array.isArray(res.body.projeto_status));
        assert.ok(Number(res.body.grandes_numeros.total_projetos) >= 1);
    });

    it('lista paginada mostra só os projetos que o usuário enxerga', async () => {
        const deA = await api(gestorA).post('/api/painel-estrategico/lista-projeto-paginado').send({ portfolio_id: [portfolioA.id] });
        assertStatus(deA, 201);
        assert.ok(deA.body.linhas.some((l: { id: number }) => l.id === projetoA.id));

        const gestorB = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoB.id });
        const deB = await api(gestorB).post('/api/painel-estrategico/lista-projeto-paginado').send({ portfolio_id: [portfolioA.id] });
        assertStatus(deB, 201);
        assert.equal(
            deB.body.linhas.some((l: { id: number }) => l.id === projetoA.id),
            false
        );
    });

    it('painel é só para quem lê projetos: Projeto.administrador leva 403', async () => {
        assertStatus(await api(admin).post('/api/painel-estrategico').send({}), 403);
    });

    it('filtro por projeto_id devolve só esse projeto', async () => {
        const res = await api(gestorA)
            .post('/api/painel-estrategico/lista-projeto-paginado')
            .send({ projeto_id: [projetoA.id] });
        assertStatus(res, 201);
        assert.deepEqual(
            res.body.linhas.map((l: { id: number }) => l.id),
            [projetoA.id]
        );
    });
});
