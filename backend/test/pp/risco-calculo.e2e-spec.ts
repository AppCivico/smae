import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';
import { criarPortfolio, criarProjeto } from './_helpers';

const GRAUS = ['Muito baixo', 'Baixo', 'Médio', 'Alto', 'Muito alto'];

function esperado(prob: number, imp: number) {
    const nivel = prob * imp;
    if (nivel < 4) return { nivel, grau: 1, resposta: 'Aceitar' };
    if (nivel < 9) return { nivel, grau: 2, resposta: 'Mitigar' };
    if (nivel < 16) return { nivel, grau: 3, resposta: 'Mitigar' };
    if (nivel < 20) return { nivel, grau: 4, resposta: 'Eliminar' };
    return { nivel, grau: 5, resposta: 'Transferir' };
}

describe('projeto-risco: cálculo e consolidados por trigger', () => {
    let admin: Sessao;
    let gestor: Sessao;
    let portfolio: { id: number };

    const base = (dados: Record<string, unknown> = {}) => ({
        titulo: uniq('Risco'),
        registrado_em: '2026-03-10',
        ...dados,
    });

    const novoProjeto = async () =>
        criarProjeto(admin, 'PP', {
            portfolio_id: portfolio.id,
            responsaveis_no_orgao_gestor: [gestor.pessoa.id],
        });

    const criarRisco = async (projetoId: number, dados: Record<string, unknown> = {}): Promise<number> => {
        const res = await api(gestor)
            .post(`/api/projeto/${projetoId}/risco`)
            .send(base(dados));
        assertStatus(res, 201);
        return res.body.id;
    };

    const patchRisco = async (projetoId: number, id: number, dados: Record<string, unknown>) =>
        assertStatus(await api(gestor).patch(`/api/projeto/${projetoId}/risco/${id}`).send(dados), 200);

    const riscoNoBanco = (id: number) => prisma().projetoRisco.findUniqueOrThrow({ where: { id } });
    const projetoNoBanco = (id: number) =>
        prisma().projeto.findUniqueOrThrow({ where: { id }, select: { qtde_riscos: true, risco_maximo: true } });

    before(async () => {
        await bootApp();
        const orgao = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios'], {
            orgao_id: orgao.id,
        });
        gestor = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgao.id });
        portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgao.id] });
    });

    it('matriz 5x5: nível, grau e resposta gravados e devolvidos pela API', async () => {
        const projeto = await novoProjeto();
        for (let prob = 1; prob <= 5; prob++) {
            for (let imp = 1; imp <= 5; imp++) {
                const id = await criarRisco(projeto.id, { probabilidade: prob, impacto: imp });
                const esp = esperado(prob, imp);

                const banco = await riscoNoBanco(id);
                assert.deepEqual(
                    { nivel: banco.nivel, grau: banco.grau, resposta: banco.resposta },
                    { nivel: esp.nivel, grau: esp.grau, resposta: esp.resposta },
                    `banco ${prob}x${imp}`
                );

                const lido = await api(gestor).get(`/api/projeto/${projeto.id}/risco/${id}`);
                assertStatus(lido, 200);
                assert.equal(lido.body.nivel, esp.nivel);
                assert.equal(lido.body.grau, esp.grau);
                assert.equal(lido.body.grau_descricao, GRAUS[esp.grau - 1]);
                assert.equal(lido.body.resposta, esp.resposta);
            }
        }
    });

    it('sem probabilidade e impacto: nada calculado, status SemInformacao', async () => {
        const projeto = await novoProjeto();
        const id = await criarRisco(projeto.id);
        const banco = await riscoNoBanco(id);
        assert.equal(banco.nivel, null);
        assert.equal(banco.grau, null);
        assert.equal(banco.resposta, null);
        assert.equal(banco.status_risco, 'SemInformacao');

        const lido = await api(gestor).get(`/api/projeto/${projeto.id}/risco/${id}`);
        assert.equal(lido.body.nivel, null);
        assert.equal(lido.body.grau_descricao, null);
    });

    it('PATCH com probabilidade e impacto recalcula nível, grau e resposta', async () => {
        const projeto = await novoProjeto();
        const id = await criarRisco(projeto.id, { probabilidade: 1, impacto: 1 });
        assert.equal((await riscoNoBanco(id)).grau, 1);

        await patchRisco(projeto.id, id, { probabilidade: 5, impacto: 5 });
        const banco = await riscoNoBanco(id);
        assert.equal(banco.nivel, 25);
        assert.equal(banco.grau, 5);
        assert.equal(banco.resposta, 'Transferir');
    });

    it('PATCH só de título preserva os valores calculados', async () => {
        const projeto = await novoProjeto();
        const id = await criarRisco(projeto.id, { probabilidade: 4, impacto: 4 });
        await patchRisco(projeto.id, id, { titulo: uniq('Novo título') });
        const banco = await riscoNoBanco(id);
        assert.equal(banco.nivel, 16);
        assert.equal(banco.grau, 4);
        assert.equal(banco.resposta, 'Eliminar');
    });

    it(
        'PATCH só da probabilidade recalcula com o impacto já gravado',
        { todo: 'BUG: update() só recalcula nivel/grau/resposta quando o DTO traz probabilidade E impacto (src/pp/risco/risco.service.ts:386)' },
        async () => {
            const projeto = await novoProjeto();
            const id = await criarRisco(projeto.id, { probabilidade: 1, impacto: 5 });
            await patchRisco(projeto.id, id, { probabilidade: 5 });
            const banco = await riscoNoBanco(id);
            assert.equal(banco.nivel, 25);
            assert.equal(banco.grau, 5);
        }
    );

    it(
        '400 com probabilidade ou impacto fora da escala 1 a 5',
        { todo: 'BUG: CreateRiscoDto aceita qualquer número em probabilidade/impacto, sem @Min/@Max (src/pp/risco/dto/create-risco.dto.ts:13)' },
        async () => {
            const projeto = await novoProjeto();
            for (const dados of [
                { probabilidade: 6, impacto: 1 },
                { probabilidade: -2, impacto: -2 },
                { probabilidade: 1, impacto: 9 },
            ]) {
                const res = await api(gestor).post(`/api/projeto/${projeto.id}/risco`).send(base(dados));
                assertStatus(res, 400);
            }
        }
    );

    describe('consolidados no projeto (qtde_riscos, risco_maximo)', () => {
        it('projeto sem riscos começa zerado', async () => {
            const projeto = await novoProjeto();
            assert.deepEqual(await projetoNoBanco(projeto.id), { qtde_riscos: 0, risco_maximo: null });
        });

        it('acompanha criação, edição de grau, fechamento e remoção', async () => {
            const projeto = await novoProjeto();
            const baixo = await criarRisco(projeto.id, { probabilidade: 1, impacto: 2 });
            assert.deepEqual(await projetoNoBanco(projeto.id), { qtde_riscos: 1, risco_maximo: 'Muito baixo' });

            const alto = await criarRisco(projeto.id, { probabilidade: 4, impacto: 4 });
            assert.deepEqual(await projetoNoBanco(projeto.id), { qtde_riscos: 2, risco_maximo: 'Alto' });

            await patchRisco(projeto.id, alto, { probabilidade: 3, impacto: 3 });
            assert.deepEqual(await projetoNoBanco(projeto.id), { qtde_riscos: 2, risco_maximo: 'Médio' });

            await patchRisco(projeto.id, alto, { status: 'ConcluiHdo' });
            assert.equal((await riscoNoBanco(alto)).status_risco, 'ConcluiHdo');
            assert.deepEqual(
                await projetoNoBanco(projeto.id),
                { qtde_riscos: 1, risco_maximo: 'Muito baixo' },
                'risco fechado sai da contagem e do máximo'
            );

            await patchRisco(projeto.id, alto, { status: 'Aumentando' });
            assert.deepEqual(await projetoNoBanco(projeto.id), { qtde_riscos: 2, risco_maximo: 'Médio' });

            assertStatus(await api(gestor).delete(`/api/projeto/${projeto.id}/risco/${alto}`), 202);
            assert.deepEqual(await projetoNoBanco(projeto.id), { qtde_riscos: 1, risco_maximo: 'Muito baixo' });

            assertStatus(await api(gestor).delete(`/api/projeto/${projeto.id}/risco/${baixo}`), 202);
            assert.deepEqual(await projetoNoBanco(projeto.id), { qtde_riscos: 0, risco_maximo: null });
        });

        it('risco sem grau não entra no máximo, mas conta na quantidade', async () => {
            const projeto = await novoProjeto();
            await criarRisco(projeto.id);
            assert.deepEqual(await projetoNoBanco(projeto.id), { qtde_riscos: 1, risco_maximo: null });
        });

        it('um projeto não altera o consolidado de outro', async () => {
            const a = await novoProjeto();
            const b = await novoProjeto();
            await criarRisco(a.id, { probabilidade: 5, impacto: 5 });
            assert.deepEqual(await projetoNoBanco(b.id), { qtde_riscos: 0, risco_maximo: null });
        });
    });

    describe('planos de ação e planos_de_acao_sem_dt_term', () => {
        const plano = (projeto_risco_id: number, orgao_id: number, dados: Record<string, unknown> = {}) => ({
            projeto_risco_id,
            orgao_id,
            contramedida: uniq('Contramedida'),
            prazo_contramedida: '2026-06-01',
            ...dados,
        });

        const semTermino = async (riscoId: number) =>
            (await riscoNoBanco(riscoId)).planos_de_acao_sem_dt_term.slice().sort((x, y) => x - y);

        it('lista os planos sem data de término e atualiza ao concluir, reabrir e remover', async () => {
            const projeto = await novoProjeto();
            const orgaoId = gestor.pessoa.orgao_id;
            const riscoId = await criarRisco(projeto.id, { probabilidade: 3, impacto: 3 });
            const outroRisco = await criarRisco(projeto.id, { probabilidade: 3, impacto: 3 });
            assert.deepEqual(await semTermino(riscoId), []);

            const criar = async (dados: Record<string, unknown> = {}, risco = riscoId): Promise<number> => {
                const res = await api(gestor)
                    .post(`/api/projeto/${projeto.id}/plano-de-acao`)
                    .send(plano(risco, orgaoId, dados));
                assertStatus(res, 201);
                return res.body.id;
            };
            const patch = async (id: number, dados: Record<string, unknown>) =>
                assertStatus(
                    await api(gestor).patch(`/api/projeto/${projeto.id}/plano-de-acao/${id}`).send(dados),
                    200
                );

            const p1 = await criar();
            const p2 = await criar();
            const p3 = await criar({ data_termino: '2026-05-01' });
            const pOutro = await criar({}, outroRisco);
            assert.deepEqual(await semTermino(riscoId), [p1, p2].sort((x, y) => x - y));
            assert.deepEqual(await semTermino(outroRisco), [pOutro]);

            await patch(p1, { data_termino: '2026-05-10' });
            assert.deepEqual(await semTermino(riscoId), [p2]);

            await patch(p3, { data_termino: null });
            assert.deepEqual(await semTermino(riscoId), [p2, p3].sort((x, y) => x - y));

            assertStatus(await api(gestor).delete(`/api/projeto/${projeto.id}/plano-de-acao/${p2}`), 202);
            assert.deepEqual(await semTermino(riscoId), [p3]);
            assert.deepEqual(await semTermino(outroRisco), [pOutro], 'outro risco intacto');

            const lido = await api(gestor).get(`/api/projeto/${projeto.id}/risco/${riscoId}`);
            assertStatus(lido, 200);
            assert.deepEqual(lido.body.planos_de_acao_sem_dt_term, [p3]);
            const ids = lido.body.planos_de_acao.map((p: { id: number }) => p.id).sort((x: number, y: number) => x - y);
            assert.deepEqual(ids, [p1, p3].sort((x, y) => x - y), 'plano removido some do detalhe do risco');

            const lista = await api(gestor).get(`/api/projeto/${projeto.id}/risco`);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === riscoId);
            assert.deepEqual(linha.planos_de_acao_sem_dt_term, [p3]);
        });

        it('400 ao criar plano de ação em risco removido', async () => {
            const projeto = await novoProjeto();
            const riscoId = await criarRisco(projeto.id, { probabilidade: 2, impacto: 2 });
            assertStatus(await api(gestor).delete(`/api/projeto/${projeto.id}/risco/${riscoId}`), 202);
            const res = await api(gestor)
                .post(`/api/projeto/${projeto.id}/plano-de-acao`)
                .send(plano(riscoId, gestor.pessoa.orgao_id));
            assertStatus(res, 400);
        });

        it('risco com plano de ação sem término continua editável e o status do risco é independente', async () => {
            const projeto = await novoProjeto();
            const riscoId = await criarRisco(projeto.id, { probabilidade: 3, impacto: 3 });
            const res = await api(gestor)
                .post(`/api/projeto/${projeto.id}/plano-de-acao`)
                .send(plano(riscoId, gestor.pessoa.orgao_id));
            assertStatus(res, 201);

            await patchRisco(projeto.id, riscoId, { status: 'SobControle' });
            const banco = await riscoNoBanco(riscoId);
            assert.equal(banco.status_risco, 'SobControle');
            assert.deepEqual(banco.planos_de_acao_sem_dt_term, [res.body.id]);
        });
    });
});
