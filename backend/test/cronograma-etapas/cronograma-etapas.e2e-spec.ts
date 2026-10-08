import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
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

type Linha = { id: number; etapa_id: number; ordem: number; inativo: boolean };

describe('cronograma-etapa', () => {
    let legado: Sessao;
    let ps: Sessao;
    let semPrivilegio: Sessao;
    let pdm: { id: number };
    let cronograma: number;

    before(async () => {
        await bootApp();
        legado = await gestorLegado();
        ps = await gestorPS();
        semPrivilegio = await criarPessoaSemPrivilegios();
        pdm = await criarPdmAntigo();
        cronograma = await criarCronogramaLegado(legado, await criarMetaLegado(legado, pdm.id));
    });

    describe('/api/cronograma-etapa (Programa de Metas legado)', () => {
        it('401 sem token, 403 sem privilégio de meta, e 400 sem cronograma_id', async () => {
            assertStatus(await api().get(`/api/cronograma-etapa?cronograma_id=${cronograma}`), 401);

            const proibida = await api(semPrivilegio).get(`/api/cronograma-etapa?cronograma_id=${cronograma}`);
            assertStatus(proibida, 403);
            assert.match(proibida.body.message, /CadastroMeta\.administrador_no_pdm/);

            assertStatus(await api(legado).get('/api/cronograma-etapa'), 400);
        });

        it('400 ao gravar vínculo sem etapa_id', async () => {
            const res = await api(legado).post('/api/cronograma-etapa').send({ cronograma_id: cronograma });
            assertStatus(res, 400);
        });

        it('lista as etapas do cronograma com ordem e nível, e reordena empurrando as outras', async () => {
            const primeira = await criarEtapa(legado, cronograma);
            const segunda = await criarEtapa(legado, cronograma);

            const antes = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}`);
            assertStatus(antes, 200);
            const linhaPrimeira: Linha = antes.body.linhas.find((l: Linha) => l.etapa_id === primeira);
            const linhaSegunda: Linha = antes.body.linhas.find((l: Linha) => l.etapa_id === segunda);
            assert.ok(linhaPrimeira && linhaSegunda);
            assert.ok(linhaSegunda.ordem > linhaPrimeira.ordem);

            assertStatus(
                await api(legado)
                    .post('/api/cronograma-etapa')
                    .send({ cronograma_id: cronograma, etapa_id: segunda, ordem: linhaPrimeira.ordem }),
                201
            );

            const depois = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}`);
            const novaSegunda: Linha = depois.body.linhas.find((l: Linha) => l.etapa_id === segunda);
            const novaPrimeira: Linha = depois.body.linhas.find((l: Linha) => l.etapa_id === primeira);
            assert.equal(novaSegunda.ordem, linhaPrimeira.ordem);
            assert.equal(novaPrimeira.ordem, linhaPrimeira.ordem + 1);
        });

        it('inativa e filtra por inativo, sem apagar a etapa', async () => {
            const etapa = await criarEtapa(legado, cronograma);
            assertStatus(
                await api(legado)
                    .post('/api/cronograma-etapa')
                    .send({ cronograma_id: cronograma, etapa_id: etapa, inativo: true }),
                201
            );

            const inativas = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}&inativo=true`);
            assertStatus(inativas, 200);
            assert.ok(inativas.body.linhas.some((l: Linha) => l.etapa_id === etapa));
            assert.ok(inativas.body.linhas.every((l: Linha) => l.inativo === true));

            const ativas = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}&inativo=false`);
            assert.ok(!ativas.body.linhas.some((l: Linha) => l.etapa_id === etapa));
        });

        it('remover o vínculo tira a etapa do cronograma, mas a etapa continua existindo', async () => {
            const etapa = await criarEtapa(legado, cronograma);
            const lista = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}`);
            const vinculo: Linha = lista.body.linhas.find((l: Linha) => l.etapa_id === etapa);
            assert.ok(vinculo);

            assertStatus(await api(legado).delete(`/api/cronograma-etapa/${vinculo.id}`), 202);

            const depois = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}`);
            assert.ok(!depois.body.linhas.some((l: Linha) => l.etapa_id === etapa));
            const existente = await prisma().etapa.findUniqueOrThrow({ where: { id: etapa } });
            assert.equal(existente.removido_em, null);
        });
    });

    describe('/api/plano-setorial-cronograma-etapa (Plano Setorial)', () => {
        it('lista etapas de PS e recusa a listagem de PS para cronograma de PDM legado', async () => {
            const psPdm = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            const metaPS = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            await liberaCronogramas();
            const cronogramaPS = await api(ps, { sistema: 'PlanoSetorial' })
                .post('/api/plano-setorial-cronograma')
                .send({ meta_id: metaPS, regionalizavel: false });
            assertStatus(cronogramaPS, 201);

            const cliente = api(ps, { sistema: 'PlanoSetorial' });
            const etapa = await cliente
                .post(`/api/plano-setorial-cronograma/${cronogramaPS.body.id}/etapa`)
                .send({ titulo: uniq('Etapa PS') });
            assertStatus(etapa, 201);

            const lista = await cliente.get(
                `/api/plano-setorial-cronograma-etapa?cronograma_id=${cronogramaPS.body.id}`
            );
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: Linha) => l.etapa_id === etapa.body.id));

            assertStatus(
                await api(semPrivilegio, { sistema: 'PlanoSetorial' }).get(
                    `/api/plano-setorial-cronograma-etapa?cronograma_id=${cronogramaPS.body.id}`
                ),
                403
            );

            const pelaRotaPDM = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronogramaPS.body.id}`);
            assertStatus(pelaRotaPDM, 400);
        });
    });
});
