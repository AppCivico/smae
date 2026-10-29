import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, loginAsSuperAdmin, prisma, Sessao } from '../lib';
import {
    criarAdminOrcamento,
    criarCenarioOrcamento,
    criarDotacaoPlanejada,
    criarIniciativaEAtividade,
    criarMetaNoPdm,
    DOTACAO,
    DOTACAO_OPERACAO,
    DOTACAO_PROJETO,
    semearDotacaoRealizada,
} from './fixtures';

type Consolidado = Record<string, string>;

describe('meta-orcamento: consolidado da meta, fila de recálculo e views', () => {
    let admin: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
    });

    const previsto = (meta_id: number, ano_referencia: number, parte_dotacao: string, custo_previsto: number, extra = {}) =>
        api(admin)
            .post('/api/meta-orcamento')
            .send({ meta_id, ano_referencia, parte_dotacao, custo_previsto, ...extra });
    const realizado = (meta_id: number, ano_referencia: number, dotacao: string, empenho: number, liquidado: number, extra = {}) =>
        api(admin)
            .post('/api/orcamento-realizado')
            .send({ meta_id, ano_referencia, dotacao, itens: [{ mes: 12, valor_empenho: empenho, valor_liquidado: liquidado }], ...extra });

    const tarefasPendentes = (meta_id: number) =>
        prisma().$queryRaw<{ id: number }[]>`
            SELECT id FROM task_queue
            WHERE type = 'refresh_meta_orcamento_consolidado' AND status = 'pending'
            AND (params->>'meta_id')::int = ${meta_id}::int`;

    async function recalcular(meta_id: number): Promise<Consolidado> {
        await prisma().$queryRaw`SELECT f_refresh_meta_orcamento_consolidado(${meta_id}::int)`;
        const c = await prisma().metaOrcamentoConsolidado.findUniqueOrThrow({ where: { meta_id } });
        const { meta_id: _m, atualizado_em: _a, ...totais } = c;
        return Object.fromEntries(Object.entries(totais).map(([k, v]) => [k, v.toFixed(2)]));
    }

    const zerado = {
        total_previsao: '0.00',
        total_empenhado: '0.00',
        total_liquidado: '0.00',
        total_previsao_projeto: '0.00',
        total_empenhado_projeto: '0.00',
        total_liquidado_projeto: '0.00',
        total_previsao_atividade: '0.00',
        total_empenhado_atividade: '0.00',
        total_liquidado_atividade: '0.00',
        total_previsao_operacao_especial: '0.00',
        total_empenhado_operacao_especial: '0.00',
        total_liquidado_operacao_especial: '0.00',
    };

    it('toda escrita de orçamento enfileira o recálculo da meta, e o consolidado separa projeto, atividade e operação especial', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        const { iniciativa, atividade } = await criarIniciativaEAtividade(meta.id);
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 10000, liquidado: 10000 });
        await semearDotacaoRealizada(ano, DOTACAO_PROJETO, { empenho: 10000, liquidado: 10000 });
        await semearDotacaoRealizada(ano, DOTACAO_OPERACAO, { empenho: 10000, liquidado: 10000 });

        assert.equal((await tarefasPendentes(meta.id)).length, 0);
        assert.deepEqual(await recalcular(meta.id), zerado);

        const pMeta = await previsto(meta.id, ano, DOTACAO, 1000);
        assertStatus(pMeta, 201);
        assert.ok((await tarefasPendentes(meta.id)).length >= 1, 'previsto da meta deve enfileirar a tarefa');
        const pIni = await previsto(meta.id, ano, DOTACAO_PROJETO, 500, { iniciativa_id: iniciativa.id });
        assertStatus(pIni, 201);
        const pAtv = await previsto(meta.id, ano, DOTACAO_OPERACAO, 200, { atividade_id: atividade.id });
        assertStatus(pAtv, 201);
        const rMeta = await realizado(meta.id, ano, DOTACAO, 300, 100);
        assertStatus(rMeta, 201);
        const rIni = await realizado(meta.id, ano, DOTACAO_PROJETO, 50, 20, { iniciativa_id: iniciativa.id });
        assertStatus(rIni, 201);
        const rAtv = await realizado(meta.id, ano, DOTACAO_OPERACAO, 7, 7, { atividade_id: atividade.id });
        assertStatus(rAtv, 201);

        const pendentes = (await tarefasPendentes(meta.id)).length;
        assert.ok(pendentes >= 6, `uma tarefa por transação, veio ${pendentes}`);

        assert.deepEqual(await recalcular(meta.id), {
            total_previsao: '1700.00',
            total_empenhado: '357.00',
            total_liquidado: '127.00',
            total_previsao_projeto: '500.00',
            total_empenhado_projeto: '50.00',
            total_liquidado_projeto: '20.00',
            total_previsao_atividade: '1000.00',
            total_empenhado_atividade: '300.00',
            total_liquidado_atividade: '100.00',
            total_previsao_operacao_especial: '200.00',
            total_empenhado_operacao_especial: '7.00',
            total_liquidado_operacao_especial: '7.00',
        });

        assertStatus(
            await api(admin).patch(`/api/meta-orcamento/${pMeta.body.id}`).send({ meta_id: meta.id, custo_previsto: 1200 }),
            202
        );
        const apos = await recalcular(meta.id);
        assert.equal(apos.total_previsao, '1900.00', 'só a última revisão do previsto conta');
        assert.equal(apos.total_previsao_atividade, '1200.00');

        assertStatus(await api(admin).delete(`/api/meta-orcamento/${pIni.body.id}`), 202);
        assert.equal((await recalcular(meta.id)).total_previsao_projeto, '0.00');

        assertStatus(await api(admin).delete(`/api/orcamento-realizado/${rMeta.body.id}`), 202);
        const semMeta = await recalcular(meta.id);
        assert.equal(semMeta.total_empenhado_atividade, '0.00');
        assert.equal(semMeta.total_empenhado, '57.00');

        const editado = await api(admin)
            .patch(`/api/orcamento-realizado/${rIni.body.id}`)
            .send({ meta_id: meta.id, iniciativa_id: iniciativa.id, itens: [{ mes: 12, valor_empenho: 90, valor_liquidado: 30 }] });
        assertStatus(editado, 200);
        const aposEdicao = await recalcular(meta.id);
        assert.equal(aposEdicao.total_empenhado_projeto, '90.00');
        assert.equal(aposEdicao.total_liquidado_projeto, '30.00');
        assert.equal(aposEdicao.total_empenhado, '97.00');
    });

    it('remover atividade ou iniciativa tira o orçamento delas do consolidado e enfileira o recálculo', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        const { iniciativa, atividade } = await criarIniciativaEAtividade(meta.id);
        await semearDotacaoRealizada(ano, DOTACAO_PROJETO, { empenho: 10000, liquidado: 10000 });
        assertStatus(await previsto(meta.id, ano, DOTACAO, 100), 201);
        assertStatus(await previsto(meta.id, ano, DOTACAO, 20, { iniciativa_id: iniciativa.id }), 201);
        assertStatus(await previsto(meta.id, ano, DOTACAO, 3, { atividade_id: atividade.id }), 201);
        assertStatus(await realizado(meta.id, ano, DOTACAO_PROJETO, 40, 4, { atividade_id: atividade.id }), 201);
        assert.equal((await recalcular(meta.id)).total_previsao, '123.00');
        const antes = (await tarefasPendentes(meta.id)).length;

        await prisma().atividade.update({ where: { id: atividade.id }, data: { removido_em: new Date() } });
        assert.ok((await tarefasPendentes(meta.id)).length > antes);
        const semAtv = await recalcular(meta.id);
        assert.equal(semAtv.total_previsao, '120.00');
        assert.equal(semAtv.total_empenhado, '0.00');

        await prisma().iniciativa.update({ where: { id: iniciativa.id }, data: { removido_em: new Date() } });
        assert.equal((await recalcular(meta.id)).total_previsao, '100.00');
        await prisma().iniciativa.update({ where: { id: iniciativa.id }, data: { removido_em: null } });
        assert.equal((await recalcular(meta.id)).total_previsao, '120.00');
    });

    it('trocar a meta da iniciativa enfileira o recálculo das duas metas', async () => {
        const a = await criarCenarioOrcamento();
        const metaB = await criarMetaNoPdm(a.pdm.id);
        const { iniciativa } = await criarIniciativaEAtividade(a.meta.id);
        assertStatus(await previsto(a.meta.id, a.ano, DOTACAO, 100), 201);
        assertStatus(await previsto(a.meta.id, a.ano, DOTACAO_PROJETO, 25, { iniciativa_id: iniciativa.id }), 201);
        assert.equal((await recalcular(a.meta.id)).total_previsao, '125.00');
        assert.equal((await recalcular(metaB.id)).total_previsao, '0.00');
        const antesA = (await tarefasPendentes(a.meta.id)).length;
        const antesB = (await tarefasPendentes(metaB.id)).length;

        await prisma().iniciativa.update({ where: { id: iniciativa.id }, data: { meta_id: metaB.id } });
        assert.ok((await tarefasPendentes(a.meta.id)).length > antesA);
        assert.ok((await tarefasPendentes(metaB.id)).length > antesB);
        assert.equal((await recalcular(metaB.id)).total_previsao, '25.00');
    });

    it('GET da meta devolve o consolidado calculado', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        assertStatus(await previsto(meta.id, ano, DOTACAO, 321.5), 201);
        await recalcular(meta.id);
        const res = await api(await loginAsSuperAdmin(), { sistema: 'PDM' }).get(`/api/meta/${meta.id}`);
        assertStatus(res, 200);
        const dto = Array.isArray(res.body.linhas) ? res.body.linhas[0] : res.body;
        assert.equal(dto.orcamento.total_previsao, '321.5');
        assert.equal(dto.orcamento.total_previsao_atividade, '321.5');
    });

    describe('views para o Metabase', () => {
        async function cenarioComAno() {
            const c = await criarCenarioOrcamento();
            await prisma().pdm.update({
                where: { id: c.pdm.id },
                data: { data_inicio: new Date(`${c.ano}-01-01`), data_fim: new Date(`${c.ano}-12-31`) },
            });
            return c;
        }
        const plano = (pdm_id: number) =>
            prisma().$queryRaw<{ id: number; ano: number; valor: number; acao_orcamentaria: string; qtde: bigint }[]>`
                SELECT id, ano, valor::float8 AS valor, acao_orcamentaria, qtde FROM view_meta_orcamento_plan
                WHERE pdm_id = ${pdm_id}::int ORDER BY acao_orcamentaria`;

        it('view_meta_orcamento_plan usa o previsto, e o planejado do ano substitui o previsto', async () => {
            const { meta, pdm, ano } = await cenarioComAno();
            assertStatus(await previsto(meta.id, ano, DOTACAO, 1000), 201);
            assertStatus(await previsto(meta.id, ano, DOTACAO_PROJETO, 400), 201);

            let linhas = await plano(pdm.id);
            assert.deepEqual(
                linhas.map((l) => [l.acao_orcamentaria, l.valor, Number(l.qtde)]),
                [
                    ['custeio', 1000, 1],
                    ['investimento', 400, 1],
                ]
            );

            await criarDotacaoPlanejada(ano, { atualizado: 5000 });
            assertStatus(
                await api(admin)
                    .post('/api/orcamento-planejado')
                    .send({ meta_id: meta.id, ano_referencia: ano, dotacao: DOTACAO, valor_planejado: 77 }),
                201
            );
            linhas = await plano(pdm.id);
            assert.deepEqual(
                linhas.map((l) => [l.acao_orcamentaria, l.valor]),
                [['custeio', 77]]
            );
        });

        it('view_meta_orcamento_plan ignora previsto removido e revisões antigas, e meta removida', async () => {
            const { meta, pdm, ano } = await cenarioComAno();
            const p = await previsto(meta.id, ano, DOTACAO, 100);
            assertStatus(p, 201);
            assertStatus(
                await api(admin).patch(`/api/meta-orcamento/${p.body.id}`).send({ meta_id: meta.id, custo_previsto: 250 }),
                202
            );
            assert.deepEqual((await plano(pdm.id)).map((l) => l.valor), [250]);

            await prisma().meta.update({ where: { id: meta.id }, data: { removido_em: new Date() } });
            assert.equal((await plano(pdm.id)).length, 0);
        });

        it('view_meta_orcamento_realizado soma empenho e liquidado por ação orçamentária e ignora removidos', async () => {
            const { meta, pdm, ano } = await cenarioComAno();
            await semearDotacaoRealizada(ano, DOTACAO, { empenho: 10000, liquidado: 10000 });
            await semearDotacaoRealizada(ano, DOTACAO_PROJETO, { empenho: 10000, liquidado: 10000 });
            const a = await realizado(meta.id, ano, DOTACAO, 300, 100);
            const b = await realizado(meta.id, ano, DOTACAO_PROJETO, 50, 20);
            assertStatus(a, 201);
            assertStatus(b, 201);

            const ler = () =>
                prisma().$queryRaw<{ acao_orcamentaria: string; valor_empenhado: string; valor_liquidado: string }[]>`
                    SELECT acao_orcamentaria, valor_empenhado::text, valor_liquidado::text
                    FROM view_meta_orcamento_realizado
                    WHERE pdm_id = ${pdm.id}::int AND valor_empenhado IS NOT NULL ORDER BY acao_orcamentaria`;
            assert.deepEqual(
                (await ler()).map((l) => [l.acao_orcamentaria, l.valor_empenhado, l.valor_liquidado]),
                [
                    ['custeio', '300.00', '100.00'],
                    ['investimento', '50.00', '20.00'],
                ]
            );
            assertStatus(await api(admin).delete(`/api/orcamento-realizado/${a.body.id}`), 202);
            assert.deepEqual(
                (await ler()).map((l) => l.acao_orcamentaria),
                ['investimento']
            );
        });
    });
});
