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
} from '../lib';
import { criarPortfolio, criarProjeto } from './_helpers';

describe('projeto-termo-encerramento', () => {
    let orgaoA: { id: number };
    let orgaoB: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let colaboradorFora: Sessao;
    let semPrivilegio: Sessao;
    let adminOrgaoB: Sessao;
    let projetoA: { id: number };

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
        const portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
        projetoA = await criarProjeto(admin, 'PP', {
            portfolio_id: portfolio.id,
            responsaveis_no_orgao_gestor: [gestorA.pessoa.id],
        });
    });

    describe('autenticação e visibilidade', () => {
        it('401 sem token e 403 sem papel de projeto', async () => {
            assertStatus(await api().get(`/api/projeto/${projetoA.id}/termo-encerramento`), 401);
            assertStatus(await api(semPrivilegio).get(`/api/projeto/${projetoA.id}/termo-encerramento`), 403);
        });

        it('400 para quem não enxerga o projeto (leitura e escrita)', async () => {
            assertStatus(await api(adminOrgaoB).get(`/api/projeto/${projetoA.id}/termo-encerramento`), 400);
            assertStatus(
                await api(colaboradorFora).patch(`/api/projeto/${projetoA.id}/termo-encerramento`).send({ previsao_custo: 1 }),
                400
            );
        });
    });

    describe('rascunho', () => {
        it('lê o termo calculado a partir do projeto, mesmo sem rascunho salvo', async () => {
            const res = await api(gestorA).get(`/api/projeto/${projetoA.id}/termo-encerramento`);
            assertStatus(res, 200);
            assert.equal(typeof res.body, 'object');
        });

        it('salva o rascunho e lê os valores de volta', async () => {
            const salvo = await api(gestorA)
                .patch(`/api/projeto/${projetoA.id}/termo-encerramento`)
                .send({ previsao_inicio: '2026-01-05', previsao_termino: '2026-12-20', previsao_custo: 1500.5 });
            assertStatus(salvo, 200);
            const lido = await api(gestorA).get(`/api/projeto/${projetoA.id}/termo-encerramento`);
            assertStatus(lido, 200);
            assert.equal(lido.body.previsao_custo, 1500.5);
        });

        it('400 com previsao_custo que não é número', async () => {
            assertStatus(
                await api(gestorA)
                    .patch(`/api/projeto/${projetoA.id}/termo-encerramento`)
                    .send({ previsao_custo: 'muito' }),
                400
            );
        });

        it('exclui o rascunho (204)', async () => {
            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/termo-encerramento`), 204);
        });
    });
});
