import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, prisma, Sessao } from '../lib';
import {
    anoUnico,
    criarAdminOrcamento,
    criarCenarioOrcamento,
    criarDotacaoPlanejada,
    criarIniciativaEAtividade,
    criarMetaNoPdm,
    DOTACAO,
    somaPlanejadoPdm,
} from '../meta-orcamento/fixtures';

describe('orcamento-planejado: somas por dotação (triggers)', () => {
    let admin: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
    });

    const post = (corpo: Record<string, unknown>) => api(admin).post('/api/orcamento-planejado').send(corpo);
    const lista = async (meta_id: number, ano: number) => {
        const res = await api(admin).get(`/api/orcamento-planejado?meta_id=${meta_id}&ano_referencia=${ano}`);
        assertStatus(res, 200);
        return res.body.linhas as Array<Record<string, any>>;
    };

    it('meta, iniciativa e atividade compartilham a dotação: soma e pressão recalculam em criar, editar e remover', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const { iniciativa, atividade } = await criarIniciativaEAtividade(meta.id);
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        assert.equal(await somaPlanejadoPdm(pdm.id, ano), null);

        const base = { ano_referencia: ano, dotacao: DOTACAO };
        const naMeta = await post({ ...base, meta_id: meta.id, valor_planejado: 400 });
        assertStatus(naMeta, 201);
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '400.00', pressao: false });

        const naIni = await post({ ...base, iniciativa_id: iniciativa.id, valor_planejado: 500 });
        assertStatus(naIni, 201);
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '900.00', pressao: false });

        const naAtv = await post({ ...base, atividade_id: atividade.id, valor_planejado: 300 });
        assertStatus(naAtv, 201);
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '1200.00', pressao: true });

        const linhas = await lista(meta.id, ano);
        assert.equal(linhas.length, 3);
        for (const l of linhas) {
            assert.equal(l.smae_soma_valor_planejado, '1200.00');
            assert.equal(l.pressao_orcamentaria, true);
            assert.equal(l.pressao_orcamentaria_valor, '200.00');
        }
        const linhaAtv = linhas.find((l) => l.id === naAtv.body.id)!;
        assert.equal(linhaAtv.atividade.id, atividade.id);
        assert.equal(linhaAtv.iniciativa.id, iniciativa.id);
        assert.equal(linhaAtv.meta.id, meta.id);

        assertStatus(
            await api(admin)
                .patch(`/api/orcamento-planejado/${naAtv.body.id}`)
                .send({ atividade_id: atividade.id, valor_planejado: 100 }),
            200
        );
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '1000.00', pressao: false });

        assertStatus(await api(admin).delete(`/api/orcamento-planejado/${naIni.body.id}`), 202);
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '500.00', pressao: false });
        const depois = await lista(meta.id, ano);
        assert.equal(depois.length, 2);
        assert.ok(depois.every((l) => l.smae_soma_valor_planejado === '500.00' && l.pressao_orcamentaria === false));

        assertStatus(await api(admin).delete(`/api/orcamento-planejado/${naMeta.body.id}`), 202);
        assertStatus(await api(admin).delete(`/api/orcamento-planejado/${naAtv.body.id}`), 202);
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '0.00', pressao: false });
    });

    it('mover o planejado da meta para a iniciativa pelo PATCH mantém a soma do PDM', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const { iniciativa } = await criarIniciativaEAtividade(meta.id);
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });

        const criado = await post({ ano_referencia: ano, dotacao: DOTACAO, meta_id: meta.id, valor_planejado: 250 });
        assertStatus(criado, 201);

        assertStatus(
            await api(admin)
                .patch(`/api/orcamento-planejado/${criado.body.id}`)
                .send({ iniciativa_id: iniciativa.id, valor_planejado: 250 }),
            200
        );
        const noBanco = await prisma().orcamentoPlanejado.findUniqueOrThrow({ where: { id: criado.body.id } });
        assert.equal(noBanco.iniciativa_id, iniciativa.id);
        assert.equal(noBanco.meta_id, meta.id);
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '250.00', pressao: false });

        const [linha] = await lista(meta.id, ano);
        assert.equal(linha.iniciativa.id, iniciativa.id);
    });

    it('a soma é por PDM: o mesmo ano e dotação em outro PDM não se mistura', async () => {
        const a = await criarCenarioOrcamento();
        const b = await criarCenarioOrcamento(a.ano);
        await criarDotacaoPlanejada(a.ano, { atualizado: 1000 });

        assertStatus(
            await post({ ano_referencia: a.ano, dotacao: DOTACAO, meta_id: a.meta.id, valor_planejado: 700 }),
            201
        );
        assertStatus(
            await post({ ano_referencia: a.ano, dotacao: DOTACAO, meta_id: b.meta.id, valor_planejado: 600 }),
            201
        );

        assert.deepEqual(await somaPlanejadoPdm(a.pdm.id, a.ano), { soma: '700.00', pressao: false });
        assert.deepEqual(await somaPlanejadoPdm(b.pdm.id, a.ano), { soma: '600.00', pressao: false });
        const [linhaA] = await lista(a.meta.id, a.ano);
        assert.equal(linhaA.smae_soma_valor_planejado, '700.00');
    });

    it('a mesma dotação em anos diferentes gera somas separadas', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const ano2 = anoUnico();
        await prisma().pdmOrcamentoConfig.create({
            data: { pdm_id: pdm.id, ano_referencia: ano2, planejado_disponivel: true },
        });
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        await criarDotacaoPlanejada(ano2, { atualizado: 100 });

        assertStatus(await post({ ano_referencia: ano, dotacao: DOTACAO, meta_id: meta.id, valor_planejado: 300 }), 201);
        assertStatus(await post({ ano_referencia: ano2, dotacao: DOTACAO, meta_id: meta.id, valor_planejado: 300 }), 201);

        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '300.00', pressao: false });
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano2), { soma: '300.00', pressao: true });
        const [linha2] = await lista(meta.id, ano2);
        assert.equal(linha2.pressao_orcamentaria_valor, '200.00');
    });

    it('duas dotações na mesma meta não interferem nas somas uma da outra', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const outra = '16.10.12.128.3011.2.181.33903600.00';
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        await criarDotacaoPlanejada(ano, { atualizado: 50, dotacao: outra });

        assertStatus(await post({ ano_referencia: ano, dotacao: DOTACAO, meta_id: meta.id, valor_planejado: 300 }), 201);
        assertStatus(await post({ ano_referencia: ano, dotacao: outra, meta_id: meta.id, valor_planejado: 80 }), 201);

        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '300.00', pressao: false });
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano, outra), { soma: '80.00', pressao: true });

        const linhas = await lista(meta.id, ano);
        const daOutra = linhas.find((l) => l.dotacao === outra)!;
        assert.equal(daOutra.pressao_orcamentaria_valor, '30.00');
        const daPrimeira = linhas.find((l) => l.dotacao === DOTACAO)!;
        assert.equal(daPrimeira.pressao_orcamentaria, false);
        assert.equal(daPrimeira.pressao_orcamentaria_valor, null);
    });

    it('SOF mudando o valor atualizado da dotação recalcula a pressão orçamentária', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const dot = await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        assertStatus(await post({ ano_referencia: ano, dotacao: DOTACAO, meta_id: meta.id, valor_planejado: 800 }), 201);
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '800.00', pressao: false });

        await prisma().dotacaoPlanejado.update({ where: { id: dot.id }, data: { val_orcado_atualizado: 500 } });
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '800.00', pressao: true });
        const [linha] = await lista(meta.id, ano);
        assert.equal(linha.val_orcado_atualizado, '500.00');
        assert.equal(linha.pressao_orcamentaria_valor, '300.00');

        await prisma().dotacaoPlanejado.update({ where: { id: dot.id }, data: { val_orcado_atualizado: 2000 } });
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '800.00', pressao: false });
    });

    describe('remoção lógica de meta, iniciativa e atividade (0078)', () => {
        async function cenario() {
            const c = await criarCenarioOrcamento();
            const metaB = await criarMetaNoPdm(c.pdm.id);
            const { iniciativa, atividade } = await criarIniciativaEAtividade(c.meta.id);
            await criarDotacaoPlanejada(c.ano, { atualizado: 10000 });
            const base = { ano_referencia: c.ano, dotacao: DOTACAO };
            await post({ ...base, meta_id: metaB.id, valor_planejado: 100 }).then((r) => assertStatus(r, 201));
            await post({ ...base, iniciativa_id: iniciativa.id, valor_planejado: 20 }).then((r) => assertStatus(r, 201));
            await post({ ...base, atividade_id: atividade.id, valor_planejado: 3 }).then((r) => assertStatus(r, 201));
            await post({ ...base, meta_id: c.meta.id, valor_planejado: 1 }).then((r) => assertStatus(r, 201));
            assert.deepEqual(await somaPlanejadoPdm(c.pdm.id, c.ano), { soma: '124.00', pressao: false });
            return { ...c, metaB, iniciativa, atividade };
        }

        it('remover a atividade tira só o valor dela da soma', async () => {
            const c = await cenario();
            await prisma().atividade.update({ where: { id: c.atividade.id }, data: { removido_em: new Date() } });
            assert.deepEqual(await somaPlanejadoPdm(c.pdm.id, c.ano), { soma: '121.00', pressao: false });
        });

        it('remover a iniciativa tira o valor dela e o das atividades filhas, e a restauração devolve', async () => {
            const c = await cenario();
            await prisma().iniciativa.update({ where: { id: c.iniciativa.id }, data: { removido_em: new Date() } });
            assert.deepEqual(await somaPlanejadoPdm(c.pdm.id, c.ano), { soma: '101.00', pressao: false });
            await prisma().iniciativa.update({ where: { id: c.iniciativa.id }, data: { removido_em: null } });
            assert.deepEqual(await somaPlanejadoPdm(c.pdm.id, c.ano), { soma: '124.00', pressao: false });
        });

        it('remover a meta tira o valor dela da soma do PDM e do GET de outra meta', async () => {
            const c = await cenario();
            await prisma().meta.update({ where: { id: c.metaB.id }, data: { removido_em: new Date() } });
            assert.deepEqual(await somaPlanejadoPdm(c.pdm.id, c.ano), { soma: '24.00', pressao: false });
            const linhas = await lista(c.meta.id, c.ano);
            assert.ok(linhas.every((l) => l.smae_soma_valor_planejado === '24.00'));
        });

        it('listagem da meta não mostra linhas de iniciativa/atividade removidas', async () => {
            const c = await cenario();
            assert.equal((await lista(c.meta.id, c.ano)).length, 3);
            await prisma().iniciativa.update({ where: { id: c.iniciativa.id }, data: { removido_em: new Date() } });
            const linhas = await lista(c.meta.id, c.ano);
            assert.equal(linhas.length, 1);
            assert.equal(linhas[0].atividade, null);
        });
    });

    it('400 ao editar para uma iniciativa que já tem a mesma dotação, sem alterar a soma', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento();
        const { iniciativa } = await criarIniciativaEAtividade(meta.id);
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        const base = { ano_referencia: ano, dotacao: DOTACAO };
        const a = await post({ ...base, meta_id: meta.id, valor_planejado: 10 });
        assertStatus(await post({ ...base, iniciativa_id: iniciativa.id, valor_planejado: 20 }), 201);

        const res = await api(admin)
            .patch(`/api/orcamento-planejado/${a.body.id}`)
            .send({ iniciativa_id: iniciativa.id, valor_planejado: 99 });
        assertStatus(res, 400);
        assert.match(res.body.message, /Já existe um registro com a mesma dotação/);
        assert.deepEqual(await somaPlanejadoPdm(pdm.id, ano), { soma: '30.00', pressao: false });
        const noBanco = await prisma().orcamentoPlanejado.findUniqueOrThrow({ where: { id: a.body.id } });
        assert.equal(Number(noBanco.valor_planejado), 10);
    });

    it('400 com iniciativa/atividade inexistente ou sem nenhum alvo', async () => {
        const { ano } = await criarCenarioOrcamento();
        await criarDotacaoPlanejada(ano, { atualizado: 1000 });
        const base = { ano_referencia: ano, dotacao: DOTACAO, valor_planejado: 1 };
        const ini = await post({ ...base, iniciativa_id: 99999999 });
        assertStatus(ini, 400);
        assert.match(ini.body.message, /iniciativa não encontrada/);
        const atv = await post({ ...base, atividade_id: 99999999 });
        assertStatus(atv, 400);
        assert.match(atv.body.message, /atividade não encontrada/);
        const nada = await post(base);
        assertStatus(nada, 400);
        assert.match(nada.body.message, /meta, iniciativa ou atividade/);
    });
});
