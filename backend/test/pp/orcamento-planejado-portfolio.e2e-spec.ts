import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao } from '../lib';
import { anoUnico, criarCenarioOrcamento, criarDotacaoPlanejada, DOTACAO } from '../meta-orcamento/fixtures';
import { criarPortfolio, criarProjeto } from './_helpers';

describe('projeto-orcamento-planejado: somas por portfolio e ano do orçamento', () => {
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

    const novoProjeto = (portfolio_id: number) => criarProjeto(admin, 'PP', { portfolio_id });
    const planejar = (projeto_id: number, ano_referencia: number, valor_planejado: number, dotacao = DOTACAO) =>
        api(admin).post(`/api/projeto/${projeto_id}/orcamento-planejado`).send({ ano_referencia, dotacao, valor_planejado });
    const lista = async (projeto_id: number, ano: number) => {
        const res = await api(admin).get(`/api/projeto/${projeto_id}/orcamento-planejado?ano_referencia=${ano}`);
        assertStatus(res, 200);
        return res.body.linhas as Array<Record<string, any>>;
    };
    const somaPortfolio = async (portfolio_id: number, ano: number) => {
        const r = await prisma().portfolioDotacaoPlanejado.findUnique({
            where: { portfolio_id_ano_referencia_dotacao: { portfolio_id, ano_referencia: ano, dotacao: DOTACAO } },
        });
        return r ? { soma: r.soma_valor_planejado.toFixed(2), pressao: r.pressao_orcamentaria } : null;
    };

    it('a soma é por portfolio: projetos do mesmo portfolio dividem a dotação, outro portfolio não', async () => {
        const ano = anoUnico();
        const dot = await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        const p1a = await novoProjeto(portfolio1.id);
        const p1b = await novoProjeto(portfolio1.id);
        const p2 = await novoProjeto(portfolio2.id);

        assertStatus(await planejar(p1a.id, ano, 600), 201);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '600.00', pressao: false });
        const b = await planejar(p1b.id, ano, 500);
        assertStatus(b, 201);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '1100.00', pressao: true });
        assertStatus(await planejar(p2.id, ano, 300), 201);
        assert.deepEqual(await somaPortfolio(portfolio2.id, ano), { soma: '300.00', pressao: false });
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '1100.00', pressao: true });

        const [linha] = await lista(p1a.id, ano);
        assert.equal(linha.smae_soma_valor_planejado, '1100.00');
        assert.equal(linha.pressao_orcamentaria, true);
        assert.equal(linha.pressao_orcamentaria_valor, '100.00');
        assert.equal(linha.val_orcado_atualizado, '1000.00');
        const [linhaP2] = await lista(p2.id, ano);
        assert.equal(linhaP2.smae_soma_valor_planejado, '300.00');
        assert.equal(linhaP2.pressao_orcamentaria, false);

        assertStatus(await api(admin).patch(`/api/projeto/${p1b.id}/orcamento-planejado/${b.body.id}`).send({ valor_planejado: 300 }), 200);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '900.00', pressao: false });

        await prisma().dotacaoPlanejado.update({ where: { id: dot.id }, data: { val_orcado_atualizado: 800 } });
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '900.00', pressao: true });
        assert.deepEqual(await somaPortfolio(portfolio2.id, ano), { soma: '300.00', pressao: false });

        assertStatus(await api(admin).delete(`/api/projeto/${p1b.id}/orcamento-planejado/${b.body.id}`), 202);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '600.00', pressao: false });
    });

    it('o planejado de projeto não entra na soma do PDM, e o da meta não entra na do portfolio', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        const projeto = await novoProjeto(portfolio1.id);
        const antes = (await somaPortfolio(portfolio1.id, ano))?.soma ?? '0.00';
        assert.equal(antes, '0.00');

        assertStatus(await planejar(projeto.id, ano, 250), 201);
        const adminMeta = await criarPessoaComPrivilegios(['CadastroMeta.administrador_orcamento', 'CadastroMeta.orcamento']);
        assertStatus(
            await api(adminMeta)
                .post('/api/orcamento-planejado')
                .send({ meta_id: meta.id, ano_referencia: ano, dotacao: DOTACAO, valor_planejado: 40 }),
            201
        );

        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '250.00', pressao: false });
        const pdmSoma = await prisma().pdmDotacaoPlanejado.findFirstOrThrow({ where: { pdm_id: pdm.id, ano_referencia: ano } });
        assert.equal(pdmSoma.soma_valor_planejado.toFixed(2), '40.00');
    });

    it('projeto removido sai da soma do portfolio', async () => {
        const ano = anoUnico();
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        const a = await novoProjeto(portfolio1.id);
        const b = await novoProjeto(portfolio1.id);
        assertStatus(await planejar(a.id, ano, 100), 201);
        assertStatus(await planejar(b.id, ano, 20), 201);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '120.00', pressao: false });

        assertStatus(await api(admin).delete(`/api/projeto/${b.id}`), 202);
        assert.deepEqual(await somaPortfolio(portfolio1.id, ano), { soma: '100.00', pressao: false });
    });

    it('ano_orcamento do projeto acompanha os anos com planejado e encolhe ao remover', async () => {
        const ano = anoUnico();
        const ano3 = ano + 2;
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        await criarDotacaoPlanejada(ano3, { atualizado: 1000 });
        const projeto = await novoProjeto(portfolio1.id);
        const anos = async () => {
            const res = await api(admin).get(`/api/projeto/${projeto.id}`);
            assertStatus(res, 200);
            return (res.body.ano_orcamento as number[]).filter((a) => a >= ano);
        };
        const base = await anos();
        assert.deepEqual(base, []);

        const a = await planejar(projeto.id, ano, 10);
        assertStatus(a, 201);
        assert.deepEqual(await anos(), [ano]);
        const c = await planejar(projeto.id, ano3, 10);
        assertStatus(c, 201);
        assert.deepEqual(await anos(), [ano, ano + 1, ano3], 'anos intermediários entram no intervalo');

        assertStatus(await api(admin).delete(`/api/projeto/${projeto.id}/orcamento-planejado/${c.body.id}`), 202);
        assert.deepEqual(await anos(), [ano]);
        assertStatus(await api(admin).delete(`/api/projeto/${projeto.id}/orcamento-planejado/${a.body.id}`), 202);
        assert.deepEqual(await anos(), []);
    });
});
