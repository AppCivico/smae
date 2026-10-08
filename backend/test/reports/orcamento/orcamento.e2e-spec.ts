import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    loginAsSuperAdmin,
    prisma,
    Sessao,
} from '../../lib';

const DOTACAO = '11.10.12.361.3010.2.100.33903900.00';
const periodo = { tipo: 'Analitico', inicio: '2027-01-01', fim: '2027-12-01' };

// o planejado só sai no relatório junto de algum executado do período
async function criarMetaComOrcamento(pdmId: number, planejado: string, empenhado: string) {
    const criadoPor = (await loginAsSuperAdmin()).pessoa.id;
    const meta = await prisma().meta.create({
        data: { pdm_id: pdmId, status: 'Ativo', codigo: 'M-ORC', titulo: 'Meta do orçamento' },
    });
    await prisma().orcamentoPlanejado.create({
        data: {
            meta_id: meta.id,
            dotacao: DOTACAO,
            ano_referencia: 2027,
            valor_planejado: planejado,
            criado_por: criadoPor,
        },
    });
    await prisma().orcamentoRealizado.create({
        data: {
            meta_id: meta.id,
            dotacao: DOTACAO,
            ano_referencia: 2027,
            mes_utilizado: 3,
            soma_valor_empenho: empenhado,
            soma_valor_liquidado: '0',
            criado_por: criadoPor,
            itens: {
                create: {
                    valor_empenho: empenhado,
                    valor_liquidado: '0',
                    mes: 3,
                    mes_corrente: true,
                    data_referencia: new Date('2027-03-01'),
                },
            },
        },
    });
    return meta;
}

describe('relatorio/orcamento', () => {
    let executor: Sessao;
    let administrador: Sessao;
    let semPrivilegio: Sessao;
    let pdmId: number;
    let metaId: number;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.PDM']);
        administrador = await criarPessoaComPrivilegios([
            'Reports.executar.PDM',
            'CadastroMeta.administrador_no_pdm_admin_cp',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        pdmId = (await criarPdmAntigo()).id;
        metaId = (await criarMetaComOrcamento(pdmId, '1234.50', '500.25')).id;
    });

    const url = '/api/relatorio/orcamento';

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send(periodo), 401);
    });

    it('403 sem Reports.executar.PDM', async () => {
        const res = await api(semPrivilegio).post(url).send(periodo);
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.PDM/);
    });

    it('400 com tipo inválido, data fora do formato ou orgaos fora de array', async () => {
        const enviar = (extra: Record<string, unknown>) =>
            api(executor)
                .post(url)
                .send({ ...periodo, ...extra });
        assertStatus(await enviar({ tipo: 'Foo' }), 400);
        assertStatus(await enviar({ inicio: '01/01/2027' }), 400);
        assertStatus(await enviar({ fim: null }), 400);
        assertStatus(await enviar({ orgaos: 'x' }), 400);
    });

    it(
        '400 com corpo vazio',
        {
            todo: 'BUG: POST /api/relatorio/orcamento: esperado 400 (inicio/fim obrigatórios), veio 500 (DateTransform recebe undefined)',
        },
        async () => {
            assertStatus(await api(executor).post(url).send({}), 400);
        }
    );

    it('201 em PDM sem orçamento devolve linhas vazias', async () => {
        const vazio = await criarPdmAntigo();

        const res = await api(executor)
            .post(url)
            .send({ ...periodo, pdm_id: vazio.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, { linhas: [], linhas_planejado: [] });
    });

    it('devolve executado e planejado da meta para quem enxerga a meta', async () => {
        const res = await api(administrador)
            .post(url)
            .send({ ...periodo, pdm_id: pdmId });
        assertStatus(res, 201);

        const executado = (res.body.linhas as Record<string, any>[]).find((l) => l.meta.id === metaId);
        assert.ok(executado, 'orçamento executado da meta não aparece');
        assert.equal(executado.dotacao, DOTACAO);
        assert.equal(executado.meta.codigo, 'M-ORC');
        assert.equal(Number(executado.smae_valor_empenhado), 500.25);
        assert.equal(executado.mes, 3);
        assert.equal(executado.ano, 2027);
        assert.equal(Number(executado.plan_valor_planejado), 1234.5);

        const planejado = (res.body.linhas_planejado as Record<string, any>[]).find((l) => l.meta.id === metaId);
        assert.ok(planejado, 'orçamento planejado da meta não aparece');
        assert.equal(planejado.dotacao, DOTACAO);
        assert.equal(Number(planejado.plan_valor_planejado), 1234.5);
        assert.equal(Number(planejado.ano), 2027);
    });

    it('Consolidado agrupa executado e planejado da meta', async () => {
        const res = await api(administrador)
            .post(url)
            .send({ ...periodo, tipo: 'Consolidado', pdm_id: pdmId });
        assertStatus(res, 201);

        const executado = (res.body.linhas as Record<string, any>[]).find((l) => l.meta.id === metaId);
        assert.ok(executado);
        assert.equal(Number(executado.smae_valor_empenhado), 500.25);
        const planejado = (res.body.linhas_planejado as Record<string, any>[]).find((l) => l.meta.id === metaId);
        assert.ok(planejado);
        assert.equal(Number(planejado.plan_valor_planejado), 1234.5);
    });

    it('quem não enxerga a meta e o filtro por órgão da dotação não trazem a linha', async () => {
        const semAcesso = await api(executor)
            .post(url)
            .send({ ...periodo, pdm_id: pdmId });
        assertStatus(semAcesso, 201);
        assert.deepEqual(semAcesso.body, { linhas: [], linhas_planejado: [] });

        const outroOrgao = await api(administrador)
            .post(url)
            .send({ ...periodo, pdm_id: pdmId, orgaos: ['99'] });
        assertStatus(outroOrgao, 201);
        assert.deepEqual(outroOrgao.body, { linhas: [], linhas_planejado: [] });

        const mesmoOrgao = await api(administrador)
            .post(url)
            .send({ ...periodo, pdm_id: pdmId, orgaos: ['11'] });
        assertStatus(mesmoOrgao, 201);
        assert.ok(mesmoOrgao.body.linhas.some((l: { meta: { id: number } }) => l.meta.id === metaId));
    });
});

describe('relatorio/plano-setorial-orcamento', () => {
    let executor: Sessao;
    let administrador: Sessao;
    let semPrivilegio: Sessao;
    let planoId: number;
    let metaId: number;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.PlanoSetorial']);
        administrador = await criarPessoaComPrivilegios(['Reports.executar.PlanoSetorial', 'CadastroPS.administrador']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        planoId = (await criarPlanoSetorial()).id;
        metaId = (await criarMetaComOrcamento(planoId, '777.00', '10.00')).id;
    });

    const url = '/api/relatorio/plano-setorial-orcamento';
    const ps = (sessao: Sessao) => api(sessao, { sistema: 'PlanoSetorial' });

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send(periodo), 401);
    });

    it('403 sem Reports.executar.PlanoSetorial', async () => {
        const res = await api(semPrivilegio).post(url).send(periodo);
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.PlanoSetorial/);
    });

    it('403 com Reports.executar.PDM (privilégio da outra rota)', async () => {
        const soPdm = await criarPessoaComPrivilegios(['Reports.executar.PDM']);
        const res = await api(soPdm).post(url).send(periodo);
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.PlanoSetorial/);
    });

    it('400 com tipo inválido ou data fora do formato', async () => {
        assertStatus(
            await ps(executor)
                .post(url)
                .send({ ...periodo, tipo: 'Foo' }),
            400
        );
        assertStatus(
            await ps(executor)
                .post(url)
                .send({ ...periodo, inicio: 'ontem' }),
            400
        );
    });

    it(
        '400 com corpo vazio',
        {
            todo: 'BUG: POST /api/relatorio/plano-setorial-orcamento: esperado 400 (inicio/fim obrigatórios), veio 500 (DateTransform recebe undefined)',
        },
        async () => {
            assertStatus(await ps(executor).post(url).send({}), 400);
        }
    );

    it('201 em plano sem orçamento devolve linhas vazias', async () => {
        const vazio = await criarPlanoSetorial();

        const res = await ps(executor)
            .post(url)
            .send({ ...periodo, pdm_id: vazio.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, { linhas: [], linhas_planejado: [] });
    });

    it('devolve executado e planejado da meta para o administrador de PS', async () => {
        const res = await ps(administrador)
            .post(url)
            .send({ ...periodo, pdm_id: planoId });
        assertStatus(res, 201);

        const executado = (res.body.linhas as Record<string, any>[]).find((l) => l.meta.id === metaId);
        assert.ok(executado, 'orçamento executado da meta não aparece');
        assert.equal(executado.dotacao, DOTACAO);
        assert.equal(Number(executado.smae_valor_empenhado), 10);
        const planejado = (res.body.linhas_planejado as Record<string, any>[]).find((l) => l.meta.id === metaId);
        assert.ok(planejado, 'orçamento planejado da meta não aparece');
        assert.equal(Number(planejado.plan_valor_planejado), 777);

        const semAcesso = await ps(executor)
            .post(url)
            .send({ ...periodo, pdm_id: planoId });
        assertStatus(semAcesso, 201);
        assert.deepEqual(semAcesso.body, { linhas: [], linhas_planejado: [] });
    });
});
