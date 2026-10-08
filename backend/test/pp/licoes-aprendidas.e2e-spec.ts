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

describe('projeto-licoes-aprendidas', () => {
    let orgaoA: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let colaboradorFora: Sessao;
    let semPrivilegio: Sessao;
    let projetoA: { id: number };
    let projetoB: { id: number };

    const licao = (dados: Record<string, unknown> = {}) => ({
        data_registro: '2026-02-15',
        responsavel: 'Equipe de obra',
        descricao: uniq('Lição'),
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
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token e 403 sem papel de projeto', async () => {
            assertStatus(await api().get(`/api/projeto/${projetoA.id}/licoes-aprendidas`), 401);
            assertStatus(await api(semPrivilegio).post(`/api/projeto/${projetoA.id}/licoes-aprendidas`).send(licao()), 403);
        });

        it('400 para colaborador fora da equipe, que nem enxerga o projeto', async () => {
            const res = await api(colaboradorFora).post(`/api/projeto/${projetoA.id}/licoes-aprendidas`).send(licao());
            assertStatus(res, 400);
            assert.match(res.body.message, /sem permissão para acesso/);
        });
    });

    describe('validação', () => {
        it('400 sem descricao e com data_registro inválida', async () => {
            assertStatus(
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/licoes-aprendidas`)
                    .send({ data_registro: '2026-02-15', responsavel: 'x' }),
                400
            );
            assertStatus(
                await api(gestorA)
                    .post(`/api/projeto/${projetoA.id}/licoes-aprendidas`)
                    .send(licao({ data_registro: 'ontem' })),
                400
            );
        });
    });

    describe('sequencial', () => {
        let primeira: { id: number };

        before(async () => {
            primeira = (await api(gestorA).post(`/api/projeto/${projetoA.id}/licoes-aprendidas`).send(licao())).body;
        });

        it('sem sequencial, numera a partir de 1 e em ordem dentro do projeto', async () => {
            assertStatus(await api(gestorA).post(`/api/projeto/${projetoA.id}/licoes-aprendidas`).send(licao()), 201);
            const lista = await api(gestorA).get(`/api/projeto/${projetoA.id}/licoes-aprendidas`);
            assertStatus(lista, 200);
            const seqs = lista.body.linhas.map((l: { sequencial: number }) => l.sequencial);
            assert.deepEqual(seqs, [1, 2]);
            assert.equal(lista.body.linhas[0].id, primeira.id);
        });

        it('400 com sequencial já usado no projeto, inclusive na edição', async () => {
            const dup = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/licoes-aprendidas`)
                .send(licao({ sequencial: 1 }));
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Valor já em uso/);

            const outra = (await api(gestorA).post(`/api/projeto/${projetoA.id}/licoes-aprendidas`).send(licao({ sequencial: 10 }))).body;
            const edicao = await api(gestorA)
                .patch(`/api/projeto/${projetoA.id}/licoes-aprendidas/${outra.id}`)
                .send({ sequencial: 1 });
            assertStatus(edicao, 400);
        });
    });

    describe('leitura, edição e remoção', () => {
        let licaoA: { id: number };
        let licaoB: { id: number };

        before(async () => {
            licaoA = (await api(gestorA).post(`/api/projeto/${projetoA.id}/licoes-aprendidas`).send(licao({ descricao: 'Do A' }))).body;
            licaoB = (await api(admin).post(`/api/projeto/${projetoB.id}/licoes-aprendidas`).send(licao({ descricao: 'Do B' }))).body;
        });

        it('lê a lição pelo projeto certo e não pelo errado', async () => {
            const lido = await api(gestorA).get(`/api/projeto/${projetoA.id}/licoes-aprendidas/${licaoA.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.descricao, 'Do A');

            const errado = await api(gestorA).get(`/api/projeto/${projetoA.id}/licoes-aprendidas/${licaoB.id}`);
            assertStatus(errado, 400);
            assert.match(errado.body.message, /Não foi possível encontrar lição/);
        });

        it('edita a descrição da própria lição', async () => {
            assertStatus(
                await api(gestorA).patch(`/api/projeto/${projetoA.id}/licoes-aprendidas/${licaoA.id}`).send({ descricao: 'Editada' }),
                200
            );
            const noBanco = await prisma().projetoLicaoAprendida.findUniqueOrThrow({ where: { id: licaoA.id } });
            assert.equal(noBanco.descricao, 'Editada');
        });

        it(
            'não edita lição de outro projeto usando o caminho de um projeto que o usuário gerencia',
            {
                todo: 'BUG: PATCH /api/projeto/:id/licoes-aprendidas/:id2 confere o sequencial dentro do projeto :id, mas o update final filtra só por id (LicoesAprendidasService.update), então uma lição de outro projeto é alterada',
            },
            async () => {
                const res = await api(gestorA)
                    .patch(`/api/projeto/${projetoA.id}/licoes-aprendidas/${licaoB.id}`)
                    .send({ descricao: 'Invadido' });
                assertStatus(res, 400);
            }
        );

        it('remove só pelo projeto da lição e some da listagem', async () => {
            assertStatus(await api(colaboradorFora).delete(`/api/projeto/${projetoA.id}/licoes-aprendidas/${licaoA.id}`), 400);
            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/licoes-aprendidas/${licaoB.id}`), 404);
            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/licoes-aprendidas/${licaoA.id}`), 202);

            const lista = await api(gestorA).get(`/api/projeto/${projetoA.id}/licoes-aprendidas`);
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === licaoA.id),
                false
            );
        });
    });
});
