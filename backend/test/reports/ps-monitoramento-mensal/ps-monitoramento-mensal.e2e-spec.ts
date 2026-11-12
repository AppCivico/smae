import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    prisma,
    Sessao,
} from '../../lib';

describe('relatorio/planos-setoriais-monitoramento-mensal', () => {
    let executorPS: Sessao;
    let executorPdM: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        executorPS = await criarPessoaComPrivilegios(['Reports.executar.PlanoSetorial']);
        executorPdM = await criarPessoaComPrivilegios(['Reports.executar.ProgramaDeMetas']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const url = '/api/relatorio/planos-setoriais-monitoramento-mensal';
    const periodo = { ano: 2027, mes: 3, listar_variaveis_regionalizadas: false };
    const vazio = { monitoramento: [], ciclo_metas: [], linhas: [], regioes: [] };

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send(periodo), 401);
    });

    it('403 sem Reports.executar.PlanoSetorial nem ProgramaDeMetas', async () => {
        const res = await api(semPrivilegio)
            .post(url)
            .send({ ...periodo, pdm_id: 1 });
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.PlanoSetorial/);
        assert.match(res.body.message, /Reports\.executar\.ProgramaDeMetas/);
    });

    it('400 com corpo vazio, mes fora de 1 a 12, ano fora do intervalo ou flag não booleana', async () => {
        const enviar = (corpo: Record<string, unknown>) =>
            api(executorPS, { sistema: 'PlanoSetorial' })
                .post(url)
                .send({ pdm_id: 1, ...corpo });
        assertStatus(await api(executorPS).post(url).send({}), 400);
        assertStatus(await enviar({ ...periodo, mes: 13 }), 400);
        assertStatus(await enviar({ ...periodo, mes: 0 }), 400);
        assertStatus(await enviar({ ...periodo, ano: 1000 }), 400);
        assertStatus(await enviar({ ...periodo, listar_variaveis_regionalizadas: 'sim' }), 400);
        assertStatus(await enviar({ ...periodo, tipo_pdm: 'XX' }), 400);
        assertStatus(await enviar({ ...periodo, tags: ['a'] }), 400);
    });

    it('400 sem pdm_id', async () => {
        const res = await api(executorPS, { sistema: 'PlanoSetorial' }).post(url).send(periodo);
        assertStatus(res, 400);
        assert.match(res.body.message, /pdm_id/);
    });

    it('201 em plano setorial sem metas devolve as quatro listas vazias', async () => {
        const plano = await criarPlanoSetorial();

        const res = await api(executorPS, { sistema: 'PlanoSetorial' })
            .post(url)
            .send({ ...periodo, pdm_id: plano.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, vazio);
    });

    it('aceita plano_setorial_id (deprecado) no lugar de pdm_id', async () => {
        const plano = await criarPlanoSetorial();

        const res = await api(executorPS, { sistema: 'PlanoSetorial' })
            .post(url)
            .send({ ...periodo, plano_setorial_id: plano.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, vazio);
    });

    it('Reports.executar.ProgramaDeMetas basta com o header ProgramaDeMetas', async () => {
        const plano = await criarPlanoSetorial({ sistema: 'ProgramaDeMetas' });

        const res = await api(executorPdM, { sistema: 'ProgramaDeMetas' })
            .post(url)
            .send({ ...periodo, pdm_id: plano.id });
        assertStatus(res, 201);
        assert.deepEqual(res.body, vazio);
    });

    it('privilégio PlanoSetorial é descartado quando o header é ProgramaDeMetas', async () => {
        const res = await api(executorPS, { sistema: 'ProgramaDeMetas' })
            .post(url)
            .send({ ...periodo, pdm_id: 1 });
        assertStatus(res, 400);
        assert.match(res.body.message, /não tem mais permissões/);
    });

    it('ciclo_metas lê só as fases configuráveis, escondendo fase e bloco desabilitados', async () => {
        const executor = await criarPessoaComPrivilegios([
            'Reports.executar.ProgramaDeMetas',
            'CadastroPDM.administrador',
        ]);
        const plano = await criarPlanoSetorial({ sistema: 'ProgramaDeMetas' });
        const db = prisma();
        const autor = executor.pessoa.id;
        const meta = await db.meta.create({
            data: { pdm_id: plano.id, status: 'Ativo', codigo: 'M-FASES', titulo: 'Meta com fases' },
        });
        const data_ciclo = new Date('2027-03-01');
        const ciclo =
            (await db.cicloFisico.findFirst({ where: { pdm_id: plano.id, data_ciclo } })) ??
            (await db.cicloFisico.create({ data: { pdm_id: plano.id, data_ciclo } }));
        await db.pdmMonitoramentoFaseConfig.updateMany({
            where: { pdm_id: plano.id },
            data: { removido_em: new Date(), removido_por: autor },
        });

        const fase = (ordem: number, rotulo: string, extra: Record<string, boolean> = {}) =>
            db.pdmMonitoramentoFaseConfig.create({
                data: { pdm_id: plano.id, ordem, rotulo, criado_por: autor, ...extra },
            });
        const analise = await fase(1, 'Análise');
        const tags = await fase(2, 'Tags', { aceita_tags: true });
        const desabilitada = await fase(3, 'Desabilitada', { habilitada: false });
        const fechamento = await fase(4, 'Fechamento');
        const bloco = (fase_id: number, ordem: number, rotulo: string, habilitado = true) =>
            db.pdmMonitoramentoBlocoConfig.create({
                data: { fase_id, ordem, rotulo, habilitado, criado_por: autor },
            });
        const texto = await bloco(analise.id, 1, 'Texto');
        const oculto = await bloco(analise.id, 2, 'Oculto', false);
        const comentario = await bloco(fechamento.id, 1, 'Comentário');
        const tagA = await db.tag.create({ data: { pdm_id: plano.id, descricao: 'Zeta' } });
        const tagB = await db.tag.create({ data: { pdm_id: plano.id, descricao: 'Alfa' } });

        const revisao = (fase_config_id: number, extra: Record<string, unknown> = {}) =>
            db.metaMonitoramentoFase.create({
                data: {
                    meta_id: meta.id,
                    ciclo_fisico_id: ciclo.id,
                    fase_config_id,
                    referencia_data: data_ciclo,
                    ultima_revisao: true,
                    criado_por: autor,
                    ...extra,
                },
            });
        await revisao(analise.id, {
            ultima_revisao: false,
            blocos: { create: [{ bloco_config_id: texto.id, conteudo: '<p>antiga</p>' }] },
        });
        const atual = await revisao(analise.id, {
            blocos: {
                create: [
                    { bloco_config_id: texto.id, conteudo: '<p>Olá <b>mundo</b></p>' },
                    { bloco_config_id: oculto.id, conteudo: '<p>não aparece</p>' },
                ],
            },
        });
        await revisao(tags.id, { tags: { create: [{ tag_id: tagA.id }, { tag_id: tagB.id }] } });
        await revisao(desabilitada.id);
        await revisao(fechamento.id, {
            fecha_ciclo: true,
            blocos: { create: [{ bloco_config_id: comentario.id, conteudo: 'fim' }] },
        });
        const arquivo = await db.arquivo.create({
            data: { tipo: 'DOCUMENTO', caminho: 'e2e/doc.pdf', nome_original: 'doc.pdf', tamanho_bytes: 1 },
        });
        await db.metaMonitoramentoFaseDocumento.create({
            data: {
                meta_id: meta.id,
                ciclo_fisico_id: ciclo.id,
                fase_config_id: analise.id,
                arquivo_id: arquivo.id,
                referencia_data: data_ciclo,
                descricao: 'anexo',
                criado_por: autor,
            },
        });

        const res = await api(executor, { sistema: 'ProgramaDeMetas' })
            .post(url)
            .send({ ...periodo, pdm_id: plano.id });
        assertStatus(res, 201);
        assert.equal(res.body.ciclo_metas.length, 1);
        const item = res.body.ciclo_metas[0];
        assert.equal(item.meta_id, meta.id);
        assert.equal(item.ciclo_fisico_id, ciclo.id);
        assert.equal(item.data_ciclo, '2027-03-01');
        assert.equal(item.ciclo_fechado, true);
        assert.equal(item.ciclo_reaberto, false);
        assert.deepEqual(
            item.fases.map((f: { config: { rotulo: string; fecha_ciclo: boolean } }) => [
                f.config.rotulo,
                f.config.fecha_ciclo,
            ]),
            [
                ['Análise', false],
                ['Tags', false],
                ['Fechamento', true],
            ]
        );

        const [faseAnalise, faseTags, faseFechamento] = item.fases;
        assert.deepEqual(faseAnalise.config.blocos, [{ id: texto.id, ordem: 1, rotulo: 'Texto' }]);
        assert.equal(faseAnalise.revisao.id, atual.id);
        assert.deepEqual(faseAnalise.revisao.blocos, [
            { bloco_id: texto.id, rotulo: 'Texto', conteudo: '<p>Olá <b>mundo</b></p>', conteudo_texto: 'Olá mundo' },
        ]);
        assert.deepEqual(faseAnalise.documentos, [
            { id: faseAnalise.documentos[0].id, descricao: 'anexo', nome_original: 'doc.pdf' },
        ]);
        assert.deepEqual(faseTags.revisao.tags, [
            { id: tagB.id, descricao: 'Alfa' },
            { id: tagA.id, descricao: 'Zeta' },
        ]);
        assert.equal(faseFechamento.revisao.fecha_ciclo, true);
        assert.equal(faseFechamento.revisao.criador.id, autor);
    });
});
