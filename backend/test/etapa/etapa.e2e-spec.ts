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
    prisma,
    Sessao,
    uniq,
} from '../lib';
import {
    criarCronogramaLegado,
    criarMetaLegado,
    criarMetaPS,
    gestorLegado,
    gestorPS,
    liberaCronogramas,
} from '../pdm/_helpers';

async function criarEtapa(g: Sessao, cronograma_id: number, dados: Record<string, unknown> = {}): Promise<number> {
    const res = await api(g)
        .post(`/api/cronograma/${cronograma_id}/etapa`)
        .send({ titulo: uniq('Etapa'), ...dados });
    assertStatus(res, 201);
    return res.body.id;
}

describe('etapa', () => {
    let legado: Sessao;
    let ps: Sessao;
    let semPrivilegio: Sessao;
    let semAdminCp: Sessao;
    let pdm: { id: number };
    let cronograma: number;

    before(async () => {
        await bootApp();
        legado = await gestorLegado();
        ps = await gestorPS();
        semPrivilegio = await criarPessoaSemPrivilegios();
        semAdminCp = await criarPessoaComPrivilegios(['CadastroMeta.administrador_no_pdm', 'CadastroPdm.editar']);
        pdm = await criarPdmAntigo();
        cronograma = await criarCronogramaLegado(legado, await criarMetaLegado(legado, pdm.id));
    });

    describe('/api/cronograma/:id/etapa e /api/etapa (Programa de Metas legado)', () => {
        it('401 sem token e 403 sem privilégio de meta', async () => {
            assertStatus(await api().patch('/api/etapa/1').send({ titulo: uniq() }), 401);

            const res = await api(semPrivilegio).post(`/api/cronograma/${cronograma}/etapa`).send({ titulo: uniq() });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroMeta\.administrador_no_pdm/);
        });

        it('400 sem titulo, com percentual acima de 100, e com datas em ordem invertida', async () => {
            assertStatus(await api(legado).post(`/api/cronograma/${cronograma}/etapa`).send({}), 400);
            assertStatus(
                await api(legado)
                    .post(`/api/cronograma/${cronograma}/etapa`)
                    .send({ titulo: uniq(), percentual_execucao: 101 }),
                400
            );

            const previsto = await api(legado)
                .post(`/api/cronograma/${cronograma}/etapa`)
                .send({ titulo: uniq(), inicio_previsto: '2025-06-10', termino_previsto: '2025-06-01' });
            assertStatus(previsto, 400);
            assert.match(previsto.body.message, /início previsto não pode ser posterior/);

            const real = await api(legado)
                .post(`/api/cronograma/${cronograma}/etapa`)
                .send({ titulo: uniq(), inicio_real: '2025-06-10', termino_real: '2025-06-01' });
            assertStatus(real, 400);
            assert.match(real.body.message, /início real não pode ser posterior/);
        });

        it('404 com cronograma inexistente', async () => {
            assertStatus(await api(legado).post('/api/cronograma/999999/etapa').send({ titulo: uniq() }), 404);
        });

        it('400 para quem não pode editar o cronograma da meta', async () => {
            const res = await api(semAdminCp).post(`/api/cronograma/${cronograma}/etapa`).send({ titulo: uniq() });
            assertStatus(res, 400);
            assert.match(res.body.message, /Meta não pode ser encontrada para etapa do cronograma/);
        });

        it('cria etapa, que entra na listagem do cronograma, e edita o título', async () => {
            const titulo = uniq('Etapa CRUD');
            const id = await criarEtapa(legado, cronograma, { titulo, descricao: 'desc E2E', peso: 3 });

            const lista = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}`);
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { etapa_id: number }) => l.etapa_id === id);
            assert.ok(linha, 'etapa criada não entrou no cronograma');
            assert.equal(linha.inativo, false);

            const novoTitulo = uniq('Etapa editada');
            assertStatus(await api(legado).patch(`/api/etapa/${id}`).send({ titulo: novoTitulo }), 200);
            const etapa = await prisma().etapa.findUniqueOrThrow({ where: { id } });
            assert.equal(etapa.titulo, novoTitulo);
            assert.equal(etapa.peso, 3);
        });

        it('400 ao reportar percentual de etapa que tem filhas', async () => {
            const pai = await criarEtapa(legado, cronograma);
            await criarEtapa(legado, cronograma, { etapa_pai_id: pai });

            const res = await api(legado).patch(`/api/etapa/${pai}`).send({ percentual_execucao: 50 });
            assertStatus(res, 400);
            assert.match(res.body.message, /Percentual de execução não pode ser enviado/);
        });

        it('remoção bloqueada por filha, e ao remover a etapa ela sai do cronograma', async () => {
            const pai = await criarEtapa(legado, cronograma);
            const filha = await criarEtapa(legado, cronograma, { etapa_pai_id: pai });

            const bloqueada = await api(legado).delete(`/api/etapa/${pai}`);
            assertStatus(bloqueada, 400);
            assert.match(bloqueada.body.message, /Apague primeiro os filhos/);

            assertStatus(await api(legado).delete(`/api/etapa/${filha}`), 202);
            assertStatus(await api(legado).delete(`/api/etapa/${pai}`), 202);

            const removida = await prisma().etapa.findUniqueOrThrow({ where: { id: pai } });
            assert.ok(removida.removido_em);
            const lista = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}`);
            assert.ok(!lista.body.linhas.some((l: { etapa_id: number }) => l.etapa_id === pai));
        });
    });

    describe('/api/plano-setorial-cronograma/:id/etapa e /api/plano-setorial-etapa (Plano Setorial)', () => {
        it('cria e edita etapa de PS, e a rota de PDM legado não alcança a etapa de PS', async () => {
            const psPdm = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            const metaPS = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            await liberaCronogramas();
            const cronogramaPS = await api(ps, { sistema: 'PlanoSetorial' })
                .post('/api/plano-setorial-cronograma')
                .send({ meta_id: metaPS, regionalizavel: false });
            assertStatus(cronogramaPS, 201);

            const cliente = api(ps, { sistema: 'PlanoSetorial' });
            const criada = await cliente
                .post(`/api/plano-setorial-cronograma/${cronogramaPS.body.id}/etapa`)
                .send({ titulo: uniq('Etapa PS') });
            assertStatus(criada, 201);

            assertStatus(
                await cliente
                    .patch(`/api/plano-setorial-etapa/${criada.body.id}`)
                    .send({ titulo: uniq('Etapa PS editada') }),
                200
            );

            const pelaRotaPDM = await api(legado).patch(`/api/etapa/${criada.body.id}`).send({ titulo: uniq() });
            assertStatus(pelaRotaPDM, 400);
        });
    });
});
