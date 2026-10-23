import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, prisma, Sessao } from '../lib';
import { anoUnico, criarCenarioOrcamento, DOTACAO, DOTACAO_PROJETO, semearDotacaoRealizada } from '../meta-orcamento/fixtures';
import { criarPortfolio, criarProjeto } from './_helpers';

const PROCESSO = '6016201700123456';

describe('projeto-orcamento-realizado: somas por portfolio (triggers)', () => {
    let admin: Sessao;
    let portfolio1: { id: number };
    let portfolio2: { id: number };

    before(async () => {
        await bootApp();
        const orgao = await criarOrgao();
        admin = await criarPessoaComPrivilegios(
            ['Projeto.administrador', 'Projeto.administrar_portfolios', 'Projeto.orcamento'],
            { orgao_id: orgao.id }
        );
        portfolio1 = await criarPortfolio(admin, 'PP', { orgaos: [orgao.id] });
        portfolio2 = await criarPortfolio(admin, 'PP', { orgaos: [orgao.id] });
    });

    const rota = (id: number) => `/api/projeto/${id}/orcamento-realizado`;
    const item = (mes: number, valor_empenho: number, valor_liquidado: number) => ({ mes, valor_empenho, valor_liquidado });
    const criar = (id: number, ano_referencia: number, dotacao: string, itens: unknown[], extra = {}) =>
        api(admin).post(rota(id)).send({ ano_referencia, dotacao, itens, ...extra });
    const novoProjeto = (portfolio_id: number) => criarProjeto(admin, 'PP', { portfolio_id });
    const lista = async (id: number, ano: number) => {
        const res = await api(admin).get(`${rota(id)}?ano_referencia=${ano}`);
        assertStatus(res, 200);
        return res.body.linhas as Array<Record<string, any>>;
    };
    const somaPortfolio = async (portfolio_id: number, ano: number, dotacao = DOTACAO) => {
        const r = await prisma().portfolioDotacaoRealizado.findUnique({
            where: { portfolio_id_ano_referencia_dotacao: { portfolio_id, ano_referencia: ano, dotacao } },
        });
        return r ? [r.soma_valor_empenho.toFixed(2), r.soma_valor_liquidado.toFixed(2)] : null;
    };

    it('401 sem token e 403 sem Projeto.orcamento', async () => {
        assertStatus(await api().get(`${rota(1)}?ano_referencia=2030`), 401);
        const semPriv = await criarPessoaSemPrivilegios();
        const res = await api(semPriv).post(rota(1)).send({ ano_referencia: 2030, dotacao: DOTACAO, itens: [item(12, 1, 1)] });
        assertStatus(res, 403);
        assert.match(res.body.message, /Projeto\.orcamento/);
    });

    it('400 quando a dotação não existe no SOF, com liquidado acima do empenho e com mês inválido', async () => {
        const ano = anoUnico();
        const p = await novoProjeto(portfolio1.id);
        const semSof = await criar(p.id, ano, DOTACAO, [item(12, 1, 1)]);
        assertStatus(semSof, 400);
        assert.match(semSof.body.message, /Dotação não foi encontrado/);

        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const liq = await criar(p.id, ano, DOTACAO, [item(12, 10, 20)]);
        assertStatus(liq, 400);
        assert.match(liq.body.message, /liquidado não pode ser maior do que valor empenhado/);
        assertStatus(await criar(p.id, ano, DOTACAO, [item(13, 1, 1)]), 400);
        assertStatus(await criar(p.id, ano, DOTACAO, []), 400);
    });

    it('registro usa o último mês, editar sobrescreve os itens e a soma do portfolio acompanha', async () => {
        const ano = anoUnico();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 10000, liquidado: 5000 });
        const p = await novoProjeto(portfolio1.id);

        const criado = await criar(p.id, ano, DOTACAO, [item(6, 300, 120), item(3, 100, 50)]);
        assertStatus(criado, 201);
        const registro = await prisma().orcamentoRealizado.findUniqueOrThrow({ where: { id: criado.body.id } });
        assert.equal(registro.projeto_id, p.id);
        assert.equal(registro.meta_id, null);
        assert.equal(registro.soma_valor_empenho.toFixed(2), '300.00');
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['300.00', '120.00']);

        assertStatus(
            await api(admin)
                .patch(`${rota(p.id)}/${criado.body.id}`)
                .send({ itens: [item(3, 100, 50), item(6, 300, 120), item(9, 450, 200)] }),
            200
        );
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['450.00', '200.00']);
        const itens = await prisma().orcamentoRealizadoItem.findMany({ where: { orcamento_realizado_id: criado.body.id } });
        assert.equal(itens.filter((i) => i.sobrescrito_por !== null).length, 2);
        assert.equal(itens.filter((i) => i.sobrescrito_por === null).length, 3);

        const [linha] = await lista(p.id, ano);
        assert.equal(linha.soma_valor_empenho, '450.00');
        assert.equal(linha.smae_soma_valor_empenho, '450.00');
        assert.equal(linha.empenho_liquido, '10000.00');
        assert.deepEqual(linha.itens.map((i: any) => i.mes).sort((a: number, b: number) => a - b), [3, 6, 9]);
    });

    it('projetos do mesmo portfolio dividem o limite do SOF; outro portfolio tem o próprio', async () => {
        const ano = anoUnico();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const a = await novoProjeto(portfolio1.id);
        const b = await novoProjeto(portfolio1.id);
        const c = await novoProjeto(portfolio2.id);

        const ra = await criar(a.id, ano, DOTACAO, [item(12, 600, 100)]);
        assertStatus(ra, 201);
        const estoura = await criar(b.id, ano, DOTACAO, [item(12, 500, 100)]);
        assertStatus(estoura, 400);
        assert.match(estoura.body.message, /excede o total do empenho no SOF/);
        assert.equal(await prisma().orcamentoRealizado.count({ where: { projeto_id: b.id } }), 0);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['600.00', '100.00']);

        const rb = await criar(b.id, ano, DOTACAO, [item(12, 400, 50)]);
        assertStatus(rb, 201);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['1000.00', '150.00']);
        assertStatus(await criar(c.id, ano, DOTACAO, [item(12, 1000, 0)]), 201);
        assert.deepEqual(await somaPortfolio(portfolio2.id, ano), ['1000.00', '0.00']);

        const sobe = await api(admin).patch(`${rota(a.id)}/${ra.body.id}`).send({ itens: [item(12, 601, 100)] });
        assertStatus(sobe, 400);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['1000.00', '150.00']);
        const [linhaA] = await lista(a.id, ano);
        assert.equal(linhaA.soma_valor_empenho, '600.00');
        assert.equal(linhaA.smae_soma_valor_empenho, '1000.00');

        assertStatus(await api(admin).delete(`${rota(b.id)}/${rb.body.id}`), 202);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['600.00', '100.00']);
        assertStatus(await api(admin).patch(`${rota(a.id)}/${ra.body.id}`).send({ itens: [item(12, 1000, 100)] }), 200);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['1000.00', '100.00']);
    });

    it('o realizado do projeto não entra na soma do PDM e o da meta não entra na do portfolio', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 10000, liquidado: 10000 });
        const p = await novoProjeto(portfolio1.id);
        assertStatus(await criar(p.id, ano, DOTACAO, [item(12, 250, 25)]), 201);
        const adminMeta = await criarPessoaComPrivilegios(['CadastroMeta.administrador_orcamento', 'CadastroMeta.orcamento']);
        assertStatus(
            await api(adminMeta)
                .post('/api/orcamento-realizado')
                .send({ meta_id: meta.id, ano_referencia: ano, dotacao: DOTACAO, itens: [item(12, 40, 4)] }),
            201
        );
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['250.00', '25.00']);
        const pdmSoma = await prisma().pdmDotacaoRealizado.findFirstOrThrow({ where: { pdm_id: pdm.id, ano_referencia: ano } });
        assert.equal(pdmSoma.soma_valor_empenho.toFixed(2), '40.00');
    });

    it('com processo ou nota, só as somas dessas chaves mudam', async () => {
        const ano = anoUnico();
        const nota = `7/${ano}`;
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 600, liquidado: 600, processo: PROCESSO });
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 250, liquidado: 250, processo: PROCESSO, nota });
        const p = await novoProjeto(portfolio1.id);

        const sem = await criar(p.id, ano, DOTACAO, [item(12, 100, 10)]);
        const comProc = await criar(p.id, ano, DOTACAO, [item(12, 200, 20)], { processo: PROCESSO });
        const comNota = await criar(p.id, ano, DOTACAO, [item(12, 250, 25)], { processo: PROCESSO, nota_empenho: nota, nota_ano: String(ano) });
        assertStatus(sem, 201);
        assertStatus(comProc, 201);
        assertStatus(comNota, 201);

        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['100.00', '10.00']);
        const proc = await prisma().portfolioDotacaoProcesso.findFirstOrThrow({
            where: { portfolio_id: portfolio1.id, ano_referencia: ano, dotacao_processo: PROCESSO },
        });
        assert.equal(proc.soma_valor_empenho.toFixed(2), '200.00');
        const pn = await prisma().portfolioDotacaoProcessoNota.findFirstOrThrow({
            where: { portfolio_id: portfolio1.id, ano_referencia: ano, dotacao_processo_nota: nota },
        });
        assert.equal(pn.soma_valor_empenho.toFixed(2), '250.00');

        const estouraNota = await api(admin).patch(`${rota(p.id)}/${comNota.body.id}`).send({ itens: [item(12, 251, 25)] });
        assertStatus(estouraNota, 400);
        const estouraProc = await api(admin).patch(`${rota(p.id)}/${comProc.body.id}`).send({ itens: [item(12, 601, 20)] });
        assertStatus(estouraProc, 400);

        const linhas = await lista(p.id, ano);
        assert.equal(linhas.find((l) => l.id === comProc.body.id)!.empenho_liquido, '600.00');
        assert.equal(linhas.find((l) => l.id === comNota.body.id)!.smae_soma_valor_empenho, '250.00');

        assertStatus(await api(admin).delete(`${rota(p.id)}/${comProc.body.id}`), 202);
        const apos = await prisma().portfolioDotacaoProcesso.findFirstOrThrow({
            where: { portfolio_id: portfolio1.id, ano_referencia: ano, dotacao_processo: PROCESSO },
        });
        assert.equal(apos.soma_valor_empenho.toFixed(2), '0.00');
    });

    it('nota de empenho de um ano anterior ao ano de referência respeita o limite do SOF', async () => {
        const ano = anoUnico();
        const nota = `8/${ano - 1}`;
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 600, liquidado: 600, processo: PROCESSO });
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 100, liquidado: 100, processo: PROCESSO, nota });
        const p = await novoProjeto(portfolio1.id);
        const extra = { processo: PROCESSO, nota_empenho: nota, nota_ano: String(ano - 1) };

        const estoura = await criar(p.id, ano, DOTACAO, [item(12, 500, 50)], extra);
        assertStatus(estoura, 400);
        assert.match(estoura.body.message, /excede o total do empenho no SOF/);

        const criado = await criar(p.id, ano, DOTACAO, [item(12, 80, 40)], extra);
        assertStatus(criado, 201);
        const pn = await prisma().portfolioDotacaoProcessoNota.findFirstOrThrow({
            where: { portfolio_id: portfolio1.id, ano_referencia: ano, dotacao_processo_nota: nota },
        });
        assert.equal(pn.soma_valor_empenho.toFixed(2), '80.00');

        const outro = await novoProjeto(portfolio1.id);
        const somaEstoura = await criar(outro.id, ano, DOTACAO, [item(12, 21, 0)], extra);
        assertStatus(somaEstoura, 400);
        assertStatus(await criar(outro.id, ano, DOTACAO, [item(12, 20, 0)], extra), 201);

        const editaEstoura = await api(admin).patch(`${rota(p.id)}/${criado.body.id}`).send({ itens: [item(12, 81, 40)] });
        assertStatus(editaEstoura, 400);
    });

    it('400 ao duplicar a dotação no projeto, mas a mesma dotação em outro ano ou projeto é aceita', async () => {
        const ano = anoUnico();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const p = await novoProjeto(portfolio1.id);
        const q = await novoProjeto(portfolio2.id);
        assertStatus(await criar(p.id, ano, DOTACAO, [item(12, 1, 1)]), 201);
        const dup = await criar(p.id, ano, DOTACAO, [item(12, 1, 1)]);
        assertStatus(dup, 400);
        assert.match(dup.body.message, /Já existe um registro com a mesma dotação/);
        assertStatus(await criar(q.id, ano, DOTACAO, [item(12, 1, 1)]), 201);
    });

    it('remove em lote recalcula a soma e rejeita lote grande', async () => {
        const ano = anoUnico();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        await semearDotacaoRealizada(ano, DOTACAO_PROJETO, { empenho: 1000, liquidado: 1000 });
        const p = await novoProjeto(portfolio1.id);
        const a = await criar(p.id, ano, DOTACAO, [item(12, 100, 10)]);
        const b = await criar(p.id, ano, DOTACAO_PROJETO, [item(12, 200, 20)]);
        assertStatus(a, 201);
        assertStatus(b, 201);

        const grande = Array.from({ length: 11 }, (_, i) => ({ id: 900000 + i }));
        const excedeu = await api(admin).delete(`${rota(p.id)}/em-lote`).send({ ids: grande });
        assertStatus(excedeu, 400);
        assert.match(excedeu.body.message, /Máximo permitido é de/);

        assertStatus(await api(admin).delete(`${rota(p.id)}/em-lote`).send({ ids: [{ id: a.body.id }, { id: b.body.id }] }), 202);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['0.00', '0.00']);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano, DOTACAO_PROJETO), ['0.00', '0.00']);
        assert.equal((await lista(p.id, ano)).length, 0);
    });

    it('não edita nem remove o realizado de um projeto pelo caminho de outro projeto', async () => {
        const ano = anoUnico();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const dono = await novoProjeto(portfolio1.id);
        const outro = await novoProjeto(portfolio1.id);
        const r = await criar(dono.id, ano, DOTACAO, [item(12, 100, 10)]);
        assertStatus(r, 201);

        assertStatus(await api(admin).patch(`${rota(outro.id)}/${r.body.id}`).send({ itens: [item(12, 1, 1)] }), 404);
        const intacto = await prisma().orcamentoRealizado.findUniqueOrThrow({ where: { id: r.body.id } });
        assert.equal(intacto.soma_valor_empenho.toFixed(2), '100.00');
    });

    it('remover pelo caminho de outro projeto responde 404 e não remove', { todo: 'BUG: remove e removeEmLote só filtram por tipo de projeto, ignoram o projeto da URL (planejado responde 404)' }, async () => {
        const ano = anoUnico();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const dono = await novoProjeto(portfolio1.id);
        const outro = await novoProjeto(portfolio1.id);
        const r = await criar(dono.id, ano, DOTACAO, [item(12, 100, 10)]);
        assertStatus(r, 201);

        const res = await api(admin).delete(`${rota(outro.id)}/${r.body.id}`);
        const aindaExiste = await prisma().orcamentoRealizado.findUniqueOrThrow({ where: { id: r.body.id } });
        assert.equal(aindaExiste.removido_em, null);
        assertStatus(res, 404);
    });

    it('projeto removido sai da soma do portfolio (0078)', async () => {
        const ano = anoUnico();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const a = await novoProjeto(portfolio1.id);
        const b = await novoProjeto(portfolio1.id);
        assertStatus(await criar(a.id, ano, DOTACAO, [item(12, 100, 10)]), 201);
        assertStatus(await criar(b.id, ano, DOTACAO, [item(12, 30, 3)]), 201);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['130.00', '13.00']);
        assertStatus(await api(admin).delete(`/api/projeto/${b.id}`), 202);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), ['100.00', '10.00']);
    });

    it('o realizado alimenta ano_orcamento do projeto', async () => {
        const ano = anoUnico();
        await semearDotacaoRealizada(ano, DOTACAO, { empenho: 1000, liquidado: 1000 });
        const p = await novoProjeto(portfolio1.id);
        const r = await criar(p.id, ano, DOTACAO, [item(12, 1, 1)]);
        assertStatus(r, 201);
        const anos = async () => ((await api(admin).get(`/api/projeto/${p.id}`)).body.ano_orcamento as number[]).filter((x) => x >= ano);
        assert.deepEqual(await anos(), [ano]);
        assertStatus(await api(admin).delete(`${rota(p.id)}/${r.body.id}`), 202);
        assert.deepEqual(await anos(), []);
    });
});
