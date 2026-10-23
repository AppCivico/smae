import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, prisma, Sessao } from '../lib';
import {
    criarAdminOrcamento,
    criarCenarioOrcamento,
    criarIniciativaEAtividade,
    criarMetaNoPdm,
    DOTACAO,
    DOTACAO_PROJETO,
    semearDotacaoRealizada,
} from '../meta-orcamento/fixtures';

const PROCESSO = '6016201700123456';
const NOTA_NUM = 123;

describe('orcamento-realizado: somas por dotação, processo e nota (triggers)', () => {
    let admin: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
    });

    const post = (corpo: Record<string, unknown>) => api(admin).post('/api/orcamento-realizado').send(corpo);
    const item = (mes: number, valor_empenho: number, valor_liquidado: number) => ({ mes, valor_empenho, valor_liquidado });

    const somaDotacao = async (pdm_id: number, ano: number, dotacao = DOTACAO) => {
        const r = await prisma().pdmDotacaoRealizado.findUnique({
            where: { pdm_id_ano_referencia_dotacao: { pdm_id, ano_referencia: ano, dotacao } },
        });
        return r ? [r.soma_valor_empenho.toFixed(2), r.soma_valor_liquidado.toFixed(2)] : null;
    };

    const lista = async (meta_id: number, ano: number) => {
        const res = await api(admin).get(`/api/orcamento-realizado?meta_id=${meta_id}&ano_referencia=${ano}`);
        assertStatus(res, 200);
        return res.body.linhas as Array<Record<string, any>>;
    };

    it('o valor do registro é o do último mês e editar sobrescreve os itens anteriores', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 10000, liquidado: 5000 });

        const criado = await post({
            meta_id: meta.id,
            ano_referencia: ano,
            dotacao: DOTACAO,
            itens: [item(6, 300, 120), item(3, 100, 50)],
        });
        assertStatus(criado, 201);

        const registro = await prisma().orcamentoRealizado.findUniqueOrThrow({
            where: { id: criado.body.id },
            include: { itens: { orderBy: { mes: 'asc' } } },
        });
        assert.equal(registro.soma_valor_empenho.toFixed(2), '300.00');
        assert.equal(registro.soma_valor_liquidado.toFixed(2), '120.00');
        assert.equal(registro.mes_utilizado, 12);
        assert.deepEqual(
            registro.itens.map((i) => [i.mes, i.mes_corrente, i.sobrescrito_por]),
            [
                [3, false, null],
                [6, true, null],
            ]
        );
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['300.00', '120.00']);

        assertStatus(
            await api(admin)
                .patch(`/api/orcamento-realizado/${criado.body.id}`)
                .send({ meta_id: meta.id, itens: [item(3, 100, 50), item(6, 300, 120), item(9, 450, 200)] }),
            200
        );
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['450.00', '200.00']);

        const itens = await prisma().orcamentoRealizadoItem.findMany({
            where: { orcamento_realizado_id: criado.body.id },
        });
        assert.equal(itens.length, 5);
        const antigos = itens.filter((i) => i.sobrescrito_por !== null);
        assert.equal(antigos.length, 2);
        assert.ok(antigos.every((i) => i.sobrescrito_por === admin.pessoa.id && i.sobrescrito_em));
        assert.equal(itens.filter((i) => i.mes_corrente && i.sobrescrito_por === null).length, 1);

        const [linha] = await lista(meta.id, ano);
        assert.equal(linha.soma_valor_empenho, '450.00');
        assert.deepEqual(
            linha.itens.map((i: any) => i.mes).sort((a: number, b: number) => a - b),
            [3, 6, 9]
        );
        assert.equal(linha.smae_soma_valor_empenho, '450.00');
        assert.equal(linha.empenho_liquido, '10000.00');
        assert.equal(linha.valor_liquidado, '5000.00');
    });

    it('metas, iniciativas e atividades do PDM dividem o empenho da dotação e o limite do SOF vale para a soma', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const { iniciativa, atividade } = await criarIniciativaEAtividade(meta.id);
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 900 });
        const base = { ano_referencia: ano, dotacao: DOTACAO };

        const naMeta = await post({ ...base, meta_id: meta.id, itens: [item(12, 400, 100)] });
        assertStatus(naMeta, 201);
        const naIni = await post({ ...base, iniciativa_id: iniciativa.id, itens: [item(12, 300, 50)] });
        assertStatus(naIni, 201);
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['700.00', '150.00']);

        const estoura = await post({ ...base, atividade_id: atividade.id, itens: [item(12, 400, 10)] });
        assertStatus(estoura, 400);
        assert.match(estoura.body.message, /excede o total do empenho no SOF/);
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['700.00', '150.00']);
        assert.equal(await prisma().orcamentoRealizado.count({ where: { atividade_id: atividade.id } }), 0);

        const cabe = await post({ ...base, atividade_id: atividade.id, itens: [item(12, 300, 10)] });
        assertStatus(cabe, 201);
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['1000.00', '160.00']);

        const linhas = await lista(meta.id, ano);
        assert.equal(linhas.length, 3);
        for (const l of linhas) assert.equal(l.smae_soma_valor_empenho, '1000.00');

        const sobe = await api(admin)
            .patch(`/api/orcamento-realizado/${naMeta.body.id}`)
            .send({ meta_id: meta.id, itens: [item(12, 401, 100)] });
        assertStatus(sobe, 400);
        assert.match(sobe.body.message, /excede o total do empenho no SOF/);
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['1000.00', '160.00']);
        const aindaIgual = await prisma().orcamentoRealizado.findUniqueOrThrow({ where: { id: naMeta.body.id } });
        assert.equal(aindaIgual.soma_valor_empenho.toFixed(2), '400.00');

        assertStatus(await api(admin).delete(`/api/orcamento-realizado/${naIni.body.id}`), 202);
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['700.00', '110.00']);
        assertStatus(
            await api(admin)
                .patch(`/api/orcamento-realizado/${naMeta.body.id}`)
                .send({ meta_id: meta.id, itens: [item(12, 700, 100)] }),
            200
        );
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['1000.00', '110.00']);
    });

    it('a soma é por PDM e por dotação: outro PDM e outra dotação têm o próprio limite', async () => {
        const a = await criarCenarioOrcamento();
        const b = await criarCenarioOrcamento(a.ano);
        await semearDotacaoRealizada(a.ano, DOTACAO, { empenho: 500, liquidado: 500 });
        await semearDotacaoRealizada(a.ano, DOTACAO_PROJETO, { empenho: 200, liquidado: 200 });

        assertStatus(
            await post({ meta_id: a.meta.id, ano_referencia: a.ano, dotacao: DOTACAO, itens: [item(12, 500, 0)] }),
            201
        );
        assertStatus(
            await post({ meta_id: b.meta.id, ano_referencia: a.ano, dotacao: DOTACAO, itens: [item(12, 500, 0)] }),
            201
        );
        assertStatus(
            await post({ meta_id: a.meta.id, ano_referencia: a.ano, dotacao: DOTACAO_PROJETO, itens: [item(12, 200, 0)] }),
            201
        );
        assert.deepEqual(await somaDotacao(a.pdm.id, a.ano), ['500.00', '0.00']);
        assert.deepEqual(await somaDotacao(b.pdm.id, a.ano), ['500.00', '0.00']);
        assert.deepEqual(await somaDotacao(a.pdm.id, a.ano, DOTACAO_PROJETO), ['200.00', '0.00']);
    });

    it('com processo, só a soma do processo muda; com nota, só a soma da nota', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const nota = `${NOTA_NUM}/${ano}`;
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 600, liquidado: 600, processo: PROCESSO });
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 250, liquidado: 250, processo: PROCESSO, nota });

        const pdmProcesso = () =>
            prisma().pdmDotacaoProcesso.findUnique({
                where: {
                    pdm_id_ano_referencia_dotacao_dotacao_processo: {
                        pdm_id: pdm.id,
                        ano_referencia: ano,
                        dotacao: DOTACAO,
                        dotacao_processo: PROCESSO,
                    },
                },
            });
        const pdmNota = () =>
            prisma().pdmDotacaoProcessoNota.findFirst({
                where: { pdm_id: pdm.id, ano_referencia: ano, dotacao: DOTACAO, dotacao_processo_nota: nota },
            });

        const semProcesso = await post({ meta_id: meta.id, ano_referencia: ano, dotacao: DOTACAO, itens: [item(12, 100, 10)] });
        assertStatus(semProcesso, 201);
        const comProcesso = await post({
            meta_id: meta.id,
            ano_referencia: ano,
            dotacao: DOTACAO,
            processo: PROCESSO,
            itens: [item(12, 200, 20)],
        });
        assertStatus(comProcesso, 201);
        const comNota = await post({
            meta_id: meta.id,
            ano_referencia: ano,
            dotacao: DOTACAO,
            processo: PROCESSO,
            nota_empenho: nota,
            nota_ano: String(ano),
            itens: [item(12, 250, 25)],
        });
        assertStatus(comNota, 201);

        assert.deepEqual(await somaDotacao(pdm.id, ano), ['100.00', '10.00']);
        assert.equal((await pdmProcesso())?.soma_valor_empenho.toFixed(2), '200.00');
        assert.equal((await pdmProcesso())?.soma_valor_liquidado.toFixed(2), '20.00');
        assert.equal((await pdmNota())?.soma_valor_empenho.toFixed(2), '250.00');

        const linhas = await lista(meta.id, ano);
        const lSem = linhas.find((l) => l.id === semProcesso.body.id)!;
        const lProc = linhas.find((l) => l.id === comProcesso.body.id)!;
        const lNota = linhas.find((l) => l.id === comNota.body.id)!;
        assert.equal(lSem.smae_soma_valor_empenho, '100.00');
        assert.equal(lSem.empenho_liquido, '1000.00');
        assert.equal(lProc.smae_soma_valor_empenho, '200.00');
        assert.equal(lProc.empenho_liquido, '600.00');
        assert.equal(lNota.smae_soma_valor_empenho, '250.00');
        assert.equal(lNota.empenho_liquido, '250.00');
        assert.equal(lNota.nota_empenho, String(NOTA_NUM), 'ano da nota igual ao ano de referência é omitido');

        const estouraNota = await api(admin)
            .patch(`/api/orcamento-realizado/${comNota.body.id}`)
            .send({ meta_id: meta.id, itens: [item(12, 251, 25)] });
        assertStatus(estouraNota, 400);
        assert.match(estouraNota.body.message, /excede o total do empenho no SOF/);
        const estouraProcesso = await api(admin)
            .patch(`/api/orcamento-realizado/${comProcesso.body.id}`)
            .send({ meta_id: meta.id, itens: [item(12, 601, 20)] });
        assertStatus(estouraProcesso, 400);

        assertStatus(await api(admin).delete(`/api/orcamento-realizado/${comProcesso.body.id}`), 202);
        assertStatus(await api(admin).delete(`/api/orcamento-realizado/${comNota.body.id}`), 202);
        assert.equal((await pdmProcesso())?.soma_valor_empenho.toFixed(2), '0.00');
        assert.equal((await pdmNota())?.soma_valor_empenho.toFixed(2), '0.00');
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['100.00', '10.00']);
    });

    it('400 com nota sem processo, nota inexistente ou processo inexistente', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const base = { meta_id: meta.id, ano_referencia: ano, dotacao: DOTACAO, itens: [item(12, 1, 1)] };

        const semProc = await post({ ...base, nota_empenho: '1/2030' });
        assertStatus(semProc, 400);
        assert.match(semProc.body.message, /Necessário enviar Processo/);
        const notaInex = await post({ ...base, processo: PROCESSO, nota_empenho: '77/2030' });
        assertStatus(notaInex, 400);
        assert.match(notaInex.body.message, /Nota de Empenho não foi encontrada/);
        const procInex = await post({ ...base, processo: PROCESSO });
        assertStatus(procInex, 400);
        assert.match(procInex.body.message, /Processo não foi encontrado/);
    });

    describe('nota de empenho de um ano anterior ao ano de referência (restos a pagar)', () => {
        async function cenarioNotaAnterior() {
            const c = await criarCenarioOrcamento();
            const nota = `${NOTA_NUM}/${c.ano - 1}`;
            await semearDotacaoRealizada(c.ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
            await semearDotacaoRealizada(c.ano, DOTACAO, { empenho: 600, liquidado: 600, processo: PROCESSO });
            await semearDotacaoRealizada(c.ano, DOTACAO, { empenho: 100, liquidado: 100, processo: PROCESSO, nota });
            const corpo = (ano_referencia: number, itens: unknown[]) => ({
                meta_id: c.meta.id,
                ano_referencia,
                dotacao: DOTACAO,
                processo: PROCESSO,
                nota_empenho: nota,
                itens,
            });
            const somaNota = (ano_referencia: number) =>
                prisma().pdmDotacaoProcessoNota.findFirst({
                    where: { pdm_id: c.pdm.id, ano_referencia, dotacao: DOTACAO, dotacao_processo_nota: nota },
                });
            return { ...c, nota, corpo, somaNota };
        }

        it('criar acima do limite do SOF da nota responde 400', { todo: 'BUG #758 (corrigido em #779): verificaNotaEmpenho consulta pdm_dotacao_processo_nota pelo ano da nota, mas a trigger grava pelo ano_referencia do registro, então o limite não é checado' }, async () => {
            const { ano, corpo } = await cenarioNotaAnterior();
            const res = await post(corpo(ano, [item(12, 500, 50)]));
            assertStatus(res, 400);
            assert.match(res.body.message, /excede o total do empenho no SOF/);
        });

        it('dentro do limite grava a soma no ano de referência e editar acima do limite responde 400', { todo: 'BUG #758 (corrigido em #779): verificaNotaEmpenho consulta pdm_dotacao_processo_nota pelo ano da nota, mas a trigger grava pelo ano_referencia do registro, então o limite não é checado' }, async () => {
            const { meta, ano, nota, corpo, somaNota } = await cenarioNotaAnterior();
            const criado = await post(corpo(ano, [item(12, 80, 40)]));
            assertStatus(criado, 201);
            assert.equal((await somaNota(ano))?.soma_valor_empenho.toFixed(2), '80.00');
            assert.equal(await somaNota(ano - 1), null, 'a trigger não grava no ano da nota');

            const linha = (await lista(meta.id, ano)).find((l) => l.id === criado.body.id)!;
            assert.equal(linha.nota_empenho, nota, 'ano da nota diferente do ano de referência é mantido');
            assert.equal(linha.smae_soma_valor_empenho, '80.00');
            assert.equal(linha.empenho_liquido, '100.00');

            const estoura = await api(admin)
                .patch(`/api/orcamento-realizado/${criado.body.id}`)
                .send({ meta_id: meta.id, itens: [item(12, 101, 40)] });
            assertStatus(estoura, 400);
            assert.match(estoura.body.message, /excede o total do empenho no SOF/);
            assertStatus(
                await api(admin).patch(`/api/orcamento-realizado/${criado.body.id}`).send({ meta_id: meta.id, itens: [item(12, 100, 40)] }),
                200
            );
        });

        it('o limite vale por ano de referência: a mesma nota no ano dela não consome o limite do ano seguinte', async () => {
            const { pdm, ano, corpo, somaNota } = await cenarioNotaAnterior();
            await prisma().pdmOrcamentoConfig.create({
                data: { pdm_id: pdm.id, ano_referencia: ano - 1, previsao_custo_disponivel: true, planejado_disponivel: true, execucao_disponivel: true },
            });
            assertStatus(await post(corpo(ano - 1, [item(12, 90, 90)])), 201);
            assertStatus(await post(corpo(ano, [item(12, 90, 30)])), 201);
            assert.equal((await somaNota(ano - 1))?.soma_valor_empenho.toFixed(2), '90.00');
            assert.equal((await somaNota(ano))?.soma_valor_empenho.toFixed(2), '90.00');
        });
    });

    describe('remoção lógica de meta, iniciativa e atividade (0078)', () => {
        async function cenario() {
            const c = await criarCenarioOrcamento();
            const metaB = await criarMetaNoPdm(c.pdm.id);
            const { iniciativa, atividade } = await criarIniciativaEAtividade(c.meta.id);
            await semearDotacaoRealizada(c.ano, DOTACAO, { empenho: 100000, liquidado: 100000 });
            const base = { ano_referencia: c.ano, dotacao: DOTACAO };
            const ids = {
                metaB: (await post({ ...base, meta_id: metaB.id, itens: [item(12, 1000, 100)] })).body.id,
                ini: (await post({ ...base, iniciativa_id: iniciativa.id, itens: [item(12, 200, 20)] })).body.id,
                atv: (await post({ ...base, atividade_id: atividade.id, itens: [item(12, 30, 3)] })).body.id,
                meta: (await post({ ...base, meta_id: c.meta.id, itens: [item(12, 4, 1)] })).body.id,
            };
            assert.ok(Object.values(ids).every(Boolean));
            assert.deepEqual(await somaDotacao(c.pdm.id, c.ano), ['1234.00', '124.00']);
            return { ...c, metaB, iniciativa, atividade, ids };
        }

        it('atividade removida sai da soma', async () => {
            const c = await cenario();
            await prisma().atividade.update({ where: { id: c.atividade.id }, data: { removido_em: new Date() } });
            assert.deepEqual(await somaDotacao(c.pdm.id, c.ano), ['1204.00', '121.00']);
        });

        it('iniciativa removida tira também as atividades dela, e restaurar devolve', async () => {
            const c = await cenario();
            await prisma().iniciativa.update({ where: { id: c.iniciativa.id }, data: { removido_em: new Date() } });
            assert.deepEqual(await somaDotacao(c.pdm.id, c.ano), ['1004.00', '101.00']);
            await prisma().iniciativa.update({ where: { id: c.iniciativa.id }, data: { removido_em: null } });
            assert.deepEqual(await somaDotacao(c.pdm.id, c.ano), ['1234.00', '124.00']);
        });

        it('meta removida sai da soma do PDM e da listagem das outras metas', async () => {
            const c = await cenario();
            await prisma().meta.update({ where: { id: c.metaB.id }, data: { removido_em: new Date() } });
            assert.deepEqual(await somaDotacao(c.pdm.id, c.ano), ['234.00', '24.00']);
            const linhas = await lista(c.meta.id, c.ano);
            assert.ok(linhas.every((l) => l.smae_soma_valor_empenho === '234.00'));
        });
    });

    it('remove em lote recalcula a soma uma vez para todas as linhas', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const { iniciativa } = await criarIniciativaEAtividade(meta.id);
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const base = { ano_referencia: ano, dotacao: DOTACAO };
        const a = await post({ ...base, meta_id: meta.id, itens: [item(12, 100, 10)] });
        const b = await post({ ...base, iniciativa_id: iniciativa.id, itens: [item(12, 200, 20)] });
        assertStatus(a, 201);
        assertStatus(b, 201);
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['300.00', '30.00']);

        assertStatus(
            await api(admin)
                .delete('/api/orcamento-realizado/em-lote')
                .send({ ids: [{ id: a.body.id }, { id: b.body.id }] }),
            202
        );
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['0.00', '0.00']);
        const removidos = await prisma().orcamentoRealizado.findMany({ where: { id: { in: [a.body.id, b.body.id] } } });
        assert.ok(removidos.every((r) => r.removido_em && r.removido_por === admin.pessoa.id));
    });

    it('registro removido não conta no duplicado: dá para recriar a mesma dotação', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const corpo = { meta_id: meta.id, ano_referencia: ano, dotacao: DOTACAO, itens: [item(12, 100, 10)] };
        const a = await post(corpo);
        assertStatus(a, 201);
        assertStatus(await api(admin).delete(`/api/orcamento-realizado/${a.body.id}`), 202);
        assertStatus(await post(corpo), 201);
        assert.deepEqual(await somaDotacao(pdm.id, ano), ['100.00', '10.00']);
        assertStatus(await api(admin).delete(`/api/orcamento-realizado/${a.body.id}`), 404);
    });
});
