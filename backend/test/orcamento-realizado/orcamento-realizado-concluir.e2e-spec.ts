import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, prisma, Sessao } from '../lib';
import {
    criarAdminOrcamento,
    criarCenarioOrcamento,
    criarPontoFocalDaMeta,
    DOTACAO,
    DOTACAO_PROJETO,
    semearDotacaoRealizada,
} from '../meta-orcamento/fixtures';

describe('orcamento-realizado: conclusão do ano por órgão', () => {
    let admin: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
    });

    const item = (valor_empenho: number, valor_liquidado: number) => ({ mes: 12, valor_empenho, valor_liquidado });
    const corpo = (meta_id: number, ano_referencia: number, dotacao = DOTACAO, valor = 100) => ({
        meta_id,
        ano_referencia,
        dotacao,
        itens: [item(valor, 10)],
    });

    async function cenario() {
        const c = await criarCenarioOrcamento();
        await semearDotacaoRealizada(c.ano, DOTACAO, { empenho: 10000, liquidado: 10000 });
        await semearDotacaoRealizada(c.ano, DOTACAO_PROJETO, { empenho: 10000, liquidado: 10000 });
        const pf = await criarPontoFocalDaMeta(c.meta.id);
        const cp = await criarPontoFocalDaMeta(c.meta.id, 'cp');
        return { ...c, pf, cp };
    }

    const get = (s: Sessao, meta_id: number, ano: number) =>
        api(s).get(`/api/orcamento-realizado?meta_id=${meta_id}&ano_referencia=${ano}`);
    const concluir = (s: Sessao, meta_id: number, ano: number, concluido: boolean) =>
        api(s).patch('/api/orcamento-realizado/orcamento-concluido').send({ meta_id, ano_referencia: ano, concluido });

    it('ponto focal conclui o ano: não edita, não cria nem remove mais, e o admin continua podendo', async () => {
        const { meta, ano, pf } = await cenario();
        const criado = await api(pf.sessao).post('/api/orcamento-realizado').send(corpo(meta.id, ano));
        assertStatus(criado, 201);

        const antes = await get(pf.sessao, meta.id, ano);
        assert.equal(antes.body.concluido.concluido, false);
        assert.equal(antes.body.permissoes.pode_editar, true);
        assert.equal(antes.body.permissoes.pode_excluir_lote, false);
        assert.equal(antes.body.concluido_admin, null);

        assertStatus(await concluir(pf.sessao, meta.id, ano, true), 202);

        const depois = await get(pf.sessao, meta.id, ano);
        assert.equal(depois.body.concluido.concluido, true);
        assert.equal(depois.body.concluido.concluido_por.id, pf.sessao.pessoa.id);
        assert.ok(depois.body.concluido.concluido_em);
        assert.equal(depois.body.permissoes.pode_editar, false);
        assert.equal(depois.body.linhas[0].pode_editar, false);

        const novo = await api(pf.sessao).post('/api/orcamento-realizado').send(corpo(meta.id, ano, DOTACAO_PROJETO));
        assertStatus(novo, 400);
        assert.match(novo.body.message, /Ano está concluido/);
        const edita = await api(pf.sessao)
            .patch(`/api/orcamento-realizado/${criado.body.id}`)
            .send({ meta_id: meta.id, itens: [item(50, 5)] });
        assertStatus(edita, 400);
        assert.match(edita.body.message, /Ano está concluido/);
        const remove = await api(pf.sessao).delete(`/api/orcamento-realizado/${criado.body.id}`);
        assertStatus(remove, 400);
        assert.match(remove.body.message, /Ano está concluido/);

        const noBanco = await prisma().orcamentoRealizado.findUniqueOrThrow({ where: { id: criado.body.id } });
        assert.equal(noBanco.soma_valor_empenho.toFixed(2), '100.00');
        assert.equal(noBanco.removido_em, null);

        const adminVe = await get(admin, meta.id, ano);
        assert.equal(adminVe.body.concluido, null);
        const doOrgao = adminVe.body.concluido_admin.find((o: any) => o.orgao.id === pf.orgao.id);
        assert.equal(doOrgao.concluido, true);
        assert.equal(doOrgao.concluido_por.id, pf.sessao.pessoa.id);
        assert.equal(adminVe.body.permissoes.pode_editar, true);
        assertStatus(
            await api(admin)
                .patch(`/api/orcamento-realizado/${criado.body.id}`)
                .send({ meta_id: meta.id, itens: [item(70, 7)] }),
            200
        );
    });

    it('só a CP ou o admin reabrem o ano, e cada conclusão vira uma nova revisão', async () => {
        const { meta, ano, pf, cp } = await cenario();
        assertStatus(await concluir(pf.sessao, meta.id, ano, true), 202);

        const tentaReabrir = await concluir(pf.sessao, meta.id, ano, false);
        assertStatus(tentaReabrir, 400);
        assert.match(tentaReabrir.body.message, /coordenadoria de planejamento/);
        const tentaReabrirAdmin = await api(pf.sessao)
            .patch('/api/orcamento-realizado/orcamento-concluido-admin')
            .send({ meta_id: meta.id, ano_referencia: ano, orgao_id: pf.orgao.id, concluido: false });
        assertStatus(tentaReabrirAdmin, 400);

        const reabre = await api(cp.sessao)
            .patch('/api/orcamento-realizado/orcamento-concluido-admin')
            .send({ meta_id: meta.id, ano_referencia: ano, orgao_id: pf.orgao.id, concluido: false });
        assertStatus(reabre, 202);

        const criado = await api(pf.sessao).post('/api/orcamento-realizado').send(corpo(meta.id, ano));
        assertStatus(criado, 201);

        assertStatus(await concluir(pf.sessao, meta.id, ano, true), 202);
        const admReabre = await api(admin)
            .patch('/api/orcamento-realizado/orcamento-concluido-admin')
            .send({ meta_id: meta.id, ano_referencia: ano, orgao_id: pf.orgao.id, concluido: false });
        assertStatus(admReabre, 202);

        const revisoes = await prisma().pdmOrcamentoRealizadoConfig.findMany({
            where: { meta_id: meta.id, ano_referencia: ano, orgao_id: pf.orgao.id },
            orderBy: { id: 'asc' },
        });
        assert.deepEqual(
            revisoes.map((r) => [r.execucao_concluida, r.ultima_revisao]),
            [
                [true, null],
                [false, null],
                [true, null],
                [false, true],
            ]
        );
        assert.deepEqual(
            revisoes.map((r) => r.atualizado_por),
            [pf.sessao.pessoa.id, cp.sessao.pessoa.id, pf.sessao.pessoa.id, admin.pessoa.id]
        );
    });

    it('a conclusão é por órgão: outro ponto focal da mesma meta segue editando', async () => {
        const { meta, ano, pf } = await cenario();
        const outro = await criarPontoFocalDaMeta(meta.id);
        assertStatus(await concluir(pf.sessao, meta.id, ano, true), 202);

        const outroVe = await get(outro.sessao, meta.id, ano);
        assert.equal(outroVe.body.concluido.concluido, false);
        assert.equal(outroVe.body.permissoes.pode_editar, true);
        assertStatus(await api(outro.sessao).post('/api/orcamento-realizado').send(corpo(meta.id, ano)), 201);
    });

    it('a conclusão vale só para o ano informado', async () => {
        const { meta, ano, pf, pdm } = await cenario();
        const ano2 = ano + 100;
        await prisma().pdmOrcamentoConfig.create({
            data: { pdm_id: pdm.id, ano_referencia: ano2, execucao_disponivel: true },
        });
        await semearDotacaoRealizada(ano2, DOTACAO, { empenho: 1000, liquidado: 1000 });
        assertStatus(await concluir(pf.sessao, meta.id, ano, true), 202);
        assertStatus(await api(pf.sessao).post('/api/orcamento-realizado').send(corpo(meta.id, ano2)), 201);
    });

    it('remover em lote exige admin ou CP na meta', async () => {
        const { meta, ano, pf, cp } = await cenario();
        const a = await api(pf.sessao).post('/api/orcamento-realizado').send(corpo(meta.id, ano));
        const b = await api(pf.sessao).post('/api/orcamento-realizado').send(corpo(meta.id, ano, DOTACAO_PROJETO));
        assertStatus(a, 201);
        assertStatus(b, 201);
        const ids = [{ id: a.body.id }, { id: b.body.id }];

        const negado = await api(pf.sessao).delete('/api/orcamento-realizado/em-lote').send({ ids });
        assertStatus(negado, 400);
        assert.match(negado.body.message, /coordenadoria de planejamento/);
        assert.equal(await prisma().orcamentoRealizado.count({ where: { id: { in: [a.body.id, b.body.id] }, removido_em: null } }), 2);

        const cpLista = await get(cp.sessao, meta.id, ano);
        assert.equal(cpLista.body.permissoes.pode_excluir_lote, true);
        assertStatus(await api(cp.sessao).delete('/api/orcamento-realizado/em-lote').send({ ids }), 202);
        assert.equal(await prisma().orcamentoRealizado.count({ where: { id: { in: [a.body.id, b.body.id] }, removido_em: null } }), 0);
    });

    it('CP edita mesmo com o ano concluído pelo ponto focal do órgão dela', async () => {
        const { meta, ano, cp } = await cenario();
        const criado = await api(cp.sessao).post('/api/orcamento-realizado').send(corpo(meta.id, ano));
        assertStatus(criado, 201);
        assertStatus(await concluir(cp.sessao, meta.id, ano, true), 202);

        const lista = await get(cp.sessao, meta.id, ano);
        assert.equal(lista.body.concluido, null);
        assert.equal(lista.body.permissoes.pode_editar, true);
        assertStatus(
            await api(cp.sessao)
                .patch(`/api/orcamento-realizado/${criado.body.id}`)
                .send({ meta_id: meta.id, itens: [item(60, 6)] }),
            200
        );
    });

    it('400 ao concluir como pessoa que não é responsável pela meta', async () => {
        const { meta, ano } = await cenario();
        const estranho = await criarPontoFocalDaMeta((await criarCenarioOrcamento()).meta.id);
        const res = await concluir(estranho.sessao, meta.id, ano, true);
        assertStatus(res, 400);
        assert.match(res.body.message, /responsável na meta/);
    });

    it('admin só marca como concluído um órgão que é responsável pela meta', { todo: 'BUG: patchOrcamentoConcluidoMetaOrgao testa o retorno de findMany (array, sempre truthy) em vez de checar se veio vazio' }, async () => {
        const { meta, ano } = await cenario();
        const naoResponsavel = await criarOrgao();
        const res = await api(admin)
            .patch('/api/orcamento-realizado/orcamento-concluido-admin')
            .send({ meta_id: meta.id, ano_referencia: ano, orgao_id: naoResponsavel.id, concluido: true });
        assertStatus(res, 400);
    });
});
