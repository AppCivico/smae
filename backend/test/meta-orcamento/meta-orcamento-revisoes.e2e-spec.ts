import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, prisma, Sessao } from '../lib';
import {
    criarAdminOrcamento,
    criarCenarioOrcamento,
    criarIniciativaEAtividade,
    DOTACAO,
    DOTACAO_PROJETO,
} from './fixtures';

describe('meta-orcamento: revisões, níveis e custo zerado', () => {
    let admin: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
    });

    const criar = (corpo: Record<string, unknown>) => api(admin).post('/api/meta-orcamento').send(corpo);
    const editar = (id: number, corpo: Record<string, unknown>) => api(admin).patch(`/api/meta-orcamento/${id}`).send(corpo);
    const listar = async (meta_id: number, ano: number) => {
        const res = await api(admin).get(`/api/meta-orcamento?meta_id=${meta_id}&ano_referencia=${ano}`);
        assertStatus(res, 200);
        return res.body as { linhas: Array<Record<string, any>>; previsto_eh_zero: boolean };
    };

    it('cada edição cria uma revisão encadeada, e só a última aparece e pode ser editada', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        const base = { meta_id: meta.id, ano_referencia: ano, parte_dotacao: DOTACAO, custo_previsto: 100 };
        const v1 = await criar(base);
        assertStatus(v1, 201);

        const e1 = await editar(v1.body.id, { meta_id: meta.id, custo_previsto: 200 });
        assertStatus(e1, 202);
        const v2 = (await listar(meta.id, ano)).linhas[0].id;
        assert.notEqual(v2, v1.body.id);

        const velha = await editar(v1.body.id, { meta_id: meta.id, custo_previsto: 999 });
        assertStatus(velha, 400);
        assert.match(velha.body.message, /já foi atualizado/);

        const e2 = await editar(v2, { meta_id: meta.id, parte_dotacao: DOTACAO_PROJETO });
        assertStatus(e2, 202);

        const noBanco = await prisma().orcamentoPrevisto.findMany({
            where: { meta_id: meta.id },
            orderBy: { id: 'asc' },
        });
        assert.deepEqual(
            noBanco.map((r) => [r.ultima_revisao, r.versao_anterior_id === null, r.custo_previsto.toFixed(2), r.parte_dotacao]),
            [
                [false, true, '100.00', DOTACAO],
                [false, false, '200.00', DOTACAO],
                [true, false, '200.00', DOTACAO_PROJETO],
            ]
        );
        assert.equal(noBanco[1].versao_anterior_id, v1.body.id);
        assert.equal(noBanco[2].versao_anterior_id, v2);
        assert.equal(noBanco[0].atualizado_por, admin.pessoa.id);

        const { linhas } = await listar(meta.id, ano);
        assert.equal(linhas.length, 1);
        assert.notEqual(linhas[0].id, v2);
        assert.equal(linhas[0].id, noBanco[2].id);
        assert.equal(linhas[0].parte_dotacao, DOTACAO_PROJETO);
        assert.equal(linhas[0].custo_previsto, '200.00');
    });

    it('editar para uma dotação que já existe na meta dá 400 e mantém a revisão atual', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        const a = await criar({ meta_id: meta.id, ano_referencia: ano, parte_dotacao: DOTACAO, custo_previsto: 10 });
        assertStatus(await criar({ meta_id: meta.id, ano_referencia: ano, parte_dotacao: DOTACAO_PROJETO, custo_previsto: 20 }), 201);

        const res = await editar(a.body.id, { meta_id: meta.id, parte_dotacao: DOTACAO_PROJETO });
        assertStatus(res, 400);
        assert.match(res.body.message, /Já existe um registro com a mesma dotação/);

        const original = await prisma().orcamentoPrevisto.findUniqueOrThrow({ where: { id: a.body.id } });
        assert.equal(original.ultima_revisao, true);
        assert.equal(await prisma().orcamentoPrevisto.count({ where: { versao_anterior_id: a.body.id } }), 0);
        assert.equal((await listar(meta.id, ano)).linhas.length, 2);
    });

    it('400 ao editar com o ano sem previsão de custo liberada', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const a = await criar({ meta_id: meta.id, ano_referencia: ano, parte_dotacao: DOTACAO, custo_previsto: 10 });
        await prisma().pdmOrcamentoConfig.updateMany({
            where: { pdm_id: pdm.id, ano_referencia: ano },
            data: { previsao_custo_disponivel: false },
        });
        const res = await editar(a.body.id, { meta_id: meta.id, custo_previsto: 20 });
        assertStatus(res, 400);
        assert.match(res.body.message, /Ano de referencia não encontrado/);
    });

    it('a mesma dotação pode existir na meta, na iniciativa e na atividade, mas não duas vezes no mesmo nível', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        const { iniciativa, atividade } = await criarIniciativaEAtividade(meta.id);
        const base = { ano_referencia: ano, parte_dotacao: DOTACAO, custo_previsto: 5 };

        assertStatus(await criar({ ...base, meta_id: meta.id }), 201);
        assertStatus(await criar({ ...base, iniciativa_id: iniciativa.id }), 201);
        assertStatus(await criar({ ...base, atividade_id: atividade.id }), 201);
        const dup = await criar({ ...base, atividade_id: atividade.id });
        assertStatus(dup, 400);
        assert.match(dup.body.message, /associada na atividade/);
        const dupIni = await criar({ ...base, iniciativa_id: iniciativa.id });
        assertStatus(dupIni, 400);
        assert.match(dupIni.body.message, /associada na iniciativa/);

        const { linhas } = await listar(meta.id, ano);
        assert.equal(linhas.length, 3);
        const daAtv = linhas.find((l) => l.atividade)!;
        assert.equal(daAtv.atividade.id, atividade.id);
        assert.equal(daAtv.iniciativa.id, iniciativa.id);
        assert.equal(daAtv.meta.id, meta.id);
        const daIni = linhas.find((l) => !l.atividade && l.iniciativa)!;
        assert.equal(daIni.iniciativa.id, iniciativa.id);
    });

    it('listagem esconde o previsto de iniciativa ou atividade removida', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        const { iniciativa, atividade } = await criarIniciativaEAtividade(meta.id);
        const base = { ano_referencia: ano, parte_dotacao: DOTACAO, custo_previsto: 5 };
        assertStatus(await criar({ ...base, iniciativa_id: iniciativa.id }), 201);
        assertStatus(await criar({ ...base, atividade_id: atividade.id }), 201);

        await prisma().atividade.update({ where: { id: atividade.id }, data: { removido_em: new Date() } });
        assert.equal((await listar(meta.id, ano)).linhas.length, 1);
        await prisma().iniciativa.update({ where: { id: iniciativa.id }, data: { removido_em: new Date() } });
        assert.equal((await listar(meta.id, ano)).linhas.length, 0);
    });

    it('custo zerado: previsto de iniciativa bloqueia, previsto removido ou de iniciativa removida não', async () => {
        const { meta, ano } = await criarCenarioOrcamento();
        const { iniciativa } = await criarIniciativaEAtividade(meta.id);
        const zerar = (considerar_zero: boolean) =>
            api(admin).patch('/api/meta-orcamento/zerado').send({ meta_id: meta.id, ano_referencia: ano, considerar_zero });

        const p = await criar({ meta_id: meta.id, ano_referencia: ano, parte_dotacao: DOTACAO, custo_previsto: 5, iniciativa_id: iniciativa.id });
        assertStatus(p, 201);
        assertStatus(await zerar(true), 400);

        await prisma().iniciativa.update({ where: { id: iniciativa.id }, data: { removido_em: new Date() } });
        assertStatus(await zerar(true), 202);
        assert.equal((await listar(meta.id, ano)).previsto_eh_zero, true);

        assertStatus(await zerar(false), 202);
        assert.equal((await listar(meta.id, ano)).previsto_eh_zero, false);
        const marcas = await prisma().orcamentoPrevistoZerado.findMany({ where: { meta_id: meta.id, ano_referencia: ano } });
        assert.equal(marcas.length, 1);
        assert.ok(marcas[0].removido_em);
    });

    it('custo zerado é por ano: marcar um ano não afeta o outro', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const ano2 = ano + 1;
        await prisma().pdmOrcamentoConfig.create({ data: { pdm_id: pdm.id, ano_referencia: ano2 } });
        assertStatus(
            await api(admin).patch('/api/meta-orcamento/zerado').send({ meta_id: meta.id, ano_referencia: ano, considerar_zero: true }),
            202
        );
        assert.equal((await listar(meta.id, ano)).previsto_eh_zero, true);
        assert.equal((await listar(meta.id, ano2)).previsto_eh_zero, false);
        assertStatus(await criar({ meta_id: meta.id, ano_referencia: ano2, parte_dotacao: DOTACAO, custo_previsto: 1 }), 201);
        assert.equal((await listar(meta.id, ano)).previsto_eh_zero, true);
    });
});
