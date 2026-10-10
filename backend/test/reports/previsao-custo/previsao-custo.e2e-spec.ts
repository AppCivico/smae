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

async function criarMetaComPrevisao(pdmId: number, custo: number, ano: number) {
    const meta = await prisma().meta.create({
        data: { pdm_id: pdmId, status: 'Ativo', codigo: 'M-PREV', titulo: 'Meta da previsão de custo' },
    });
    await prisma().orcamentoPrevisto.create({
        data: {
            meta_id: meta.id,
            ano_referencia: ano,
            custo_previsto: custo,
            parte_dotacao: '10.*.12.361.*.2.100.*.00',
            ultima_revisao: true,
            criado_por: (await loginAsSuperAdmin()).pessoa.id,
        },
    });
    return meta;
}

describe('relatorio/previsao-custo', () => {
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
        metaId = (await criarMetaComPrevisao(pdmId, 1500.5, 2027)).id;
    });

    const url = '/api/relatorio/previsao-custo';

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({ ano: 2027 }), 401);
    });

    it('403 sem Reports.executar.PDM', async () => {
        const res = await api(semPrivilegio).post(url).send({ ano: 2027 });
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.PDM/);
    });

    it('400 sem ano nem periodo_ano Corrente', async () => {
        const res = await api(executor).post(url).send({});
        assertStatus(res, 400);
        assert.match(res.body.message, /Ano de referência não informado/);
    });

    it('400 com periodo_ano fora do enum, ano inválido ou tipo_pdm inválido', async () => {
        assertStatus(await api(executor).post(url).send({ periodo_ano: 'Futuro' }), 400);
        assertStatus(await api(executor).post(url).send({ ano: 'x' }), 400);
        assertStatus(await api(executor).post(url).send({ ano: 2027, tipo_pdm: 'XX' }), 400);
        assertStatus(
            await api(executor)
                .post(url)
                .send({ ano: 2027, tags: ['a'] }),
            400
        );
    });

    it('201 em PDM sem previsão devolve linhas vazias', async () => {
        const vazio = await criarPdmAntigo();

        const res = await api(executor).post(url).send({ ano: 2027, pdm_id: vazio.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, { linhas: [] });
    });

    it('devolve a previsão de custo da meta para quem enxerga a meta', async () => {
        const res = await api(administrador).post(url).send({ ano: 2027, pdm_id: pdmId });
        assertStatus(res, 201);

        const linha = (res.body.linhas as Record<string, any>[]).find((l) => l.meta?.id === metaId);
        assert.ok(linha, 'previsão da meta não aparece');
        assert.equal(linha.meta.codigo, 'M-PREV');
        assert.equal(linha.custo_previsto, '1500.50');
        assert.equal(linha.ano_referencia, 2027);
        assert.equal(linha.parte_dotacao, '10.**.12.361.****.2.100.********.00');
        assert.equal(linha.versao_anterior_id, null);
    });

    it('ano diferente não traz a linha e quem não enxerga a meta recebe vazio', async () => {
        const outroAno = await api(administrador).post(url).send({ ano: 2028, pdm_id: pdmId });
        assertStatus(outroAno, 201);
        assert.deepEqual(outroAno.body, { linhas: [] });

        const semAcesso = await api(executor).post(url).send({ ano: 2027, pdm_id: pdmId });
        assertStatus(semAcesso, 201);
        assert.deepEqual(semAcesso.body, { linhas: [] });
    });

    it('periodo_ano Corrente dispensa o ano e usa o ano atual', async () => {
        const anoAtual = new Date().getFullYear();
        const pdmCorrente = await criarPdmAntigo();
        const meta = await criarMetaComPrevisao(pdmCorrente.id, 10, anoAtual);

        const res = await api(administrador).post(url).send({ periodo_ano: 'Corrente', pdm_id: pdmCorrente.id });
        assertStatus(res, 201);
        assert.ok(res.body.linhas.some((l: { meta: { id: number } }) => l.meta.id === meta.id));
    });
});

describe('relatorio/plano-setorial-previsao-custo', () => {
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
        metaId = (await criarMetaComPrevisao(planoId, 320, 2027)).id;
    });

    const url = '/api/relatorio/plano-setorial-previsao-custo';
    const ps = (sessao: Sessao) => api(sessao, { sistema: 'PlanoSetorial' });

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({ ano: 2027 }), 401);
    });

    it('403 sem Reports.executar.PlanoSetorial', async () => {
        const res = await api(semPrivilegio).post(url).send({ ano: 2027 });
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.PlanoSetorial/);
    });

    it('403 com Reports.executar.PDM (privilégio da outra rota)', async () => {
        const soPdm = await criarPessoaComPrivilegios(['Reports.executar.PDM']);
        assertStatus(await api(soPdm).post(url).send({ ano: 2027 }), 403);
    });

    it('400 sem ano e com periodo_ano fora do enum', async () => {
        assertStatus(await ps(executor).post(url).send({}), 400);
        assertStatus(await ps(executor).post(url).send({ periodo_ano: 'Futuro' }), 400);
    });

    it('devolve a previsão de custo da meta para o administrador de PS e vazio para os demais', async () => {
        const res = await ps(administrador).post(url).send({ ano: 2027, pdm_id: planoId });
        assertStatus(res, 201);
        const linha = (res.body.linhas as Record<string, any>[]).find((l) => l.meta?.id === metaId);
        assert.ok(linha, 'previsão da meta não aparece');
        assert.equal(linha.custo_previsto, '320.00');

        const semAcesso = await ps(executor).post(url).send({ ano: 2027, pdm_id: planoId });
        assertStatus(semAcesso, 201);
        assert.deepEqual(semAcesso.body, { linhas: [] });
    });
});
