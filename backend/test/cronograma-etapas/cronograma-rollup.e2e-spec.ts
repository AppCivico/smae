import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPlanoSetorial, prisma, Sessao, uniq } from '../lib';
import { criarCronogramaPS, criarEtapaPS, criarMetaPS, gestorPS } from '../pdm/_helpers';

const ymd = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

type Linha = {
    id: number;
    etapa_id: number;
    ordem: number;
    inativo: boolean;
    atraso: number | null;
    atraso_grau: string;
    etapa: {
        n_filhos_imediatos: number | null;
        etapa_filha: Linha['etapa'][];
        etapa_id: number;
        ordem: number;
        atraso: number | null;
        atraso_grau: string;
    };
};

describe('cronograma, etapas e consolidação (rollup)', () => {
    let ps: Sessao;
    let cliente: ReturnType<typeof api>;
    let planoId: number;

    before(async () => {
        await bootApp();
        ps = await gestorPS();
        cliente = api(ps, { sistema: 'PlanoSetorial' });
        planoId = (await criarPlanoSetorial({ sistema: 'PlanoSetorial' })).id;
    });

    const novoCronograma = async () => {
        const meta = await criarMetaPS(ps, planoId);
        const cronograma = await criarCronogramaPS(ps, { meta_id: meta });
        return { meta, cronograma };
    };
    const etapa = (id: number) => prisma().etapa.findUniqueOrThrow({ where: { id } });
    const crono = (id: number) => prisma().cronograma.findUniqueOrThrow({ where: { id } });
    const patch = (id: number, dados: Record<string, unknown>) =>
        cliente.patch(`/api/plano-setorial-etapa/${id}`).send(dados);
    const lista = async (cronograma_id: number, extra = '') => {
        const res = await cliente.get(`/api/plano-setorial-cronograma-etapa?cronograma_id=${cronograma_id}${extra}`);
        assertStatus(res, 200);
        return res.body.linhas as Linha[];
    };

    describe('datas previstas', () => {
        it('esticam de subfase para fase, etapa e cronograma, e acompanham as edições', async () => {
            const { cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma, { inicio_previsto: '2031-06-01', termino_previsto: '2031-06-02' });
            const f = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e });
            const s1 = await criarEtapaPS(ps, cronograma, {
                etapa_pai_id: f,
                inicio_previsto: '2031-01-10',
                termino_previsto: '2031-01-20',
            });
            const s2 = await criarEtapaPS(ps, cronograma, {
                etapa_pai_id: f,
                inicio_previsto: '2031-01-15',
                termino_previsto: '2031-03-01',
            });

            for (const id of [f, e]) {
                const linha = await etapa(id);
                assert.equal(ymd(linha.inicio_previsto), '2031-01-10');
                assert.equal(ymd(linha.termino_previsto), '2031-03-01');
            }
            const c1 = await crono(cronograma);
            assert.equal(ymd(c1.inicio_previsto), '2031-01-10');
            assert.equal(ymd(c1.termino_previsto), '2031-03-01');

            assertStatus(await patch(s2, { termino_previsto: '2031-02-10' }), 200);
            assertStatus(await patch(s1, { inicio_previsto: '2031-01-02' }), 200);
            const eDepois = await etapa(e);
            assert.equal(ymd(eDepois.inicio_previsto), '2031-01-02');
            assert.equal(ymd(eDepois.termino_previsto), '2031-02-10');
            const c2 = await crono(cronograma);
            assert.equal(ymd(c2.inicio_previsto), '2031-01-02');
            assert.equal(ymd(c2.termino_previsto), '2031-02-10');
        });

        it('um filho sem data impede o pai de ter término, até a data ser preenchida', async () => {
            const { cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma);
            const s1 = await criarEtapaPS(ps, cronograma, {
                etapa_pai_id: e,
                inicio_previsto: '2031-02-01',
                termino_previsto: '2031-02-10',
            });
            assert.equal(ymd((await etapa(e)).termino_previsto), '2031-02-10');
            assert.equal(ymd((await crono(cronograma)).termino_previsto), '2031-02-10');

            const s2 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e, inicio_previsto: '2031-02-05' });
            const semTermino = await etapa(e);
            assert.equal(semTermino.termino_previsto, null);
            assert.equal(ymd(semTermino.inicio_previsto), '2031-02-01');
            assert.equal((await crono(cronograma)).termino_previsto, null);

            assertStatus(await patch(s2, { termino_previsto: '2031-04-01' }), 200);
            assert.equal(ymd((await etapa(e)).termino_previsto), '2031-04-01');
            assert.equal(ymd((await crono(cronograma)).termino_previsto), '2031-04-01');
            assert.ok(s1);
        });

        it('etapa com filhos não aceita edição direta das datas', async () => {
            const { cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma);
            await criarEtapaPS(ps, cronograma, {
                etapa_pai_id: e,
                inicio_previsto: '2031-02-01',
                termino_previsto: '2031-02-10',
            });

            const res = await patch(e, { termino_previsto: '2031-12-31' });
            assertStatus(res, 400);
            assert.match(res.body.message, /datas não podem ser modificadas/);
            assert.equal(ymd((await etapa(e)).termino_previsto), '2031-02-10');
        });

        it('cronograma usa o menor início entre todos os níveis e o maior término só entre as etapas de topo', async () => {
            const { cronograma } = await novoCronograma();
            const e1 = await criarEtapaPS(ps, cronograma, { inicio_previsto: '2031-05-01', termino_previsto: '2031-05-31' });
            const e2 = await criarEtapaPS(ps, cronograma, { inicio_previsto: '2031-03-01', termino_previsto: '2031-09-30' });
            const c = await crono(cronograma);
            assert.equal(ymd(c.inicio_previsto), '2031-03-01');
            assert.equal(ymd(c.termino_previsto), '2031-09-30');

            assertStatus(await patch(e2, { termino_previsto: '2031-04-01' }), 200);
            assert.equal(ymd((await crono(cronograma)).termino_previsto), '2031-05-31');
            assert.ok(e1);
        });
    });

    describe('datas reais', () => {
        it('pai só tem início/término real quando todos os filhos têm, e o cronograma só fecha com todas as etapas', async () => {
            const { cronograma } = await novoCronograma();
            const e1 = await criarEtapaPS(ps, cronograma);
            const s1 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e1 });
            const s2 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e1 });
            const e2 = await criarEtapaPS(ps, cronograma);

            assertStatus(await patch(s1, { inicio_real: '2031-01-05' }), 200);
            const parcial = await etapa(e1);
            assert.equal(parcial.inicio_real, null, 'pai não pode ter início real com filho sem');

            assertStatus(await patch(s2, { inicio_real: '2031-01-03' }), 200);
            assert.equal(ymd((await etapa(e1)).inicio_real), '2031-01-03');

            assertStatus(await patch(s1, { termino_real: '2031-02-01' }), 200);
            assert.equal((await etapa(e1)).termino_real, null);
            assertStatus(await patch(s2, { termino_real: '2031-02-20' }), 200);
            assert.equal(ymd((await etapa(e1)).termino_real), '2031-02-20');
            assert.equal((await crono(cronograma)).termino_real, null, 'e2 ainda não terminou');

            assertStatus(await patch(e2, { inicio_real: '2031-02-01', termino_real: '2031-03-15' }), 200);
            const fechado = await crono(cronograma);
            assert.equal(ymd(fechado.termino_real), '2031-03-15');
            assert.equal(ymd(fechado.inicio_real), '2031-01-03');

            assertStatus(await patch(e2, { termino_real: null }), 200);
            assert.equal((await crono(cronograma)).termino_real, null, 'limpar o término reabre o cronograma');
        });

        it(
            'cronograma usa o menor início real já preenchido mesmo que só uma subfase tenha começado',
            { todo: 'BUG: trigger só recalcula o cronograma quando uma etapa de topo muda (0033-triggers-crono-etapa.pgsql, f_trg_estapa_esticar_datas_do_pai)' },
            async () => {
                const { cronograma } = await novoCronograma();
                const e = await criarEtapaPS(ps, cronograma);
                const s1 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e });
                await criarEtapaPS(ps, cronograma, { etapa_pai_id: e });
                assertStatus(await patch(s1, { inicio_real: '2031-01-05' }), 200);
                assert.equal(ymd((await crono(cronograma)).inicio_real), '2031-01-05');
            }
        );

        it('400 para término real anterior ao início real e nada é gravado', async () => {
            const { cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma, { inicio_real: '2031-05-10' });
            const res = await patch(e, { termino_real: '2031-05-01' });
            assertStatus(res, 400);
            assert.match(res.body.message, /término real não pode ser anterior/);
            assert.equal((await etapa(e)).termino_real, null);
        });
    });

    describe('percentual de execução ponderado por peso', () => {
        it('sobe de subfase até o cronograma e é recalculado a cada mudança de peso, percentual ou remoção', async () => {
            const { cronograma } = await novoCronograma();
            const e1 = await criarEtapaPS(ps, cronograma, { peso: 2 });
            const f1 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e1, peso: 1 });
            const f2 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e1, peso: 1, percentual_execucao: 75 });
            const s1 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: f1, peso: 1, percentual_execucao: 100 });
            const s2 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: f1, peso: 3, percentual_execucao: 0 });
            const e2 = await criarEtapaPS(ps, cronograma, { peso: 1, percentual_execucao: 100 });

            assert.equal((await etapa(f1)).percentual_execucao, 25);
            assert.equal((await etapa(e1)).percentual_execucao, 50);
            assert.equal((await crono(cronograma)).percentual_execucao, 67);

            assertStatus(await patch(s2, { percentual_execucao: 100 }), 200);
            assert.equal((await etapa(f1)).percentual_execucao, 100);
            assert.equal((await etapa(e1)).percentual_execucao, 88);
            assert.equal((await crono(cronograma)).percentual_execucao, 92);

            assertStatus(await patch(s2, { peso: 1, percentual_execucao: 0 }), 200);
            assert.equal((await etapa(f1)).percentual_execucao, 50);

            assertStatus(await cliente.delete(`/api/plano-setorial-etapa/${s2}`), 202);
            assert.equal((await etapa(f1)).percentual_execucao, 100);
            assert.equal((await etapa(e1)).percentual_execucao, 88);

            assertStatus(await patch(e2, { peso: 5 }), 200);
            assert.equal((await crono(cronograma)).percentual_execucao, 97);
            assert.ok(s1);
        });

        it('etapa sem peso não entra na média e, sem nenhum peso, o percentual do cronograma fica nulo', async () => {
            const { cronograma } = await novoCronograma();
            await criarEtapaPS(ps, cronograma, { percentual_execucao: 100 });
            assert.equal((await crono(cronograma)).percentual_execucao, null);

            await criarEtapaPS(ps, cronograma, { peso: 1, percentual_execucao: 40 });
            assert.equal((await crono(cronograma)).percentual_execucao, 40);
        });

        it('400 ao reportar percentual de uma etapa que já tem filhas e o valor calculado é mantido', async () => {
            const { cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma, { peso: 1 });
            await criarEtapaPS(ps, cronograma, { etapa_pai_id: e, peso: 1, percentual_execucao: 30 });
            assertStatus(await patch(e, { percentual_execucao: 90 }), 400);
            assert.equal((await etapa(e)).percentual_execucao, 30);
        });
    });

    describe('remoção e inativação', () => {
        it('remover a fase tira ela dos cálculos do pai e do cronograma, e zera n_filhos_imediatos quando é a última', async () => {
            const { cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma);
            const f1 = await criarEtapaPS(ps, cronograma, {
                etapa_pai_id: e,
                peso: 1,
                percentual_execucao: 100,
                inicio_previsto: '2031-01-01',
                termino_previsto: '2031-01-31',
            });
            const f2 = await criarEtapaPS(ps, cronograma, {
                etapa_pai_id: e,
                peso: 1,
                percentual_execucao: 0,
                inicio_previsto: '2031-03-01',
                termino_previsto: '2031-06-30',
            });
            assert.equal((await etapa(e)).n_filhos_imediatos, 2);
            assert.equal((await etapa(e)).percentual_execucao, 50);
            assert.equal(ymd((await crono(cronograma)).termino_previsto), '2031-06-30');

            assertStatus(await cliente.delete(`/api/plano-setorial-etapa/${f2}`), 202);
            const depois = await etapa(e);
            assert.equal(depois.n_filhos_imediatos, 1);
            assert.equal(depois.percentual_execucao, 100);
            assert.equal(ymd(depois.termino_previsto), '2031-01-31');
            assert.equal(ymd((await crono(cronograma)).termino_previsto), '2031-01-31');

            const linhas = await lista(cronograma);
            const top = linhas.find((l) => l.etapa_id === e)!;
            assert.deepEqual(
                top.etapa.etapa_filha.map((x) => x.etapa_id),
                [f1]
            );

            assertStatus(await cliente.delete(`/api/plano-setorial-etapa/${f1}`), 202);
            assert.equal((await etapa(e)).n_filhos_imediatos, 0);
            assertStatus(await patch(e, { percentual_execucao: 20 }), 200);
            assert.equal((await etapa(e)).percentual_execucao, 20);
        });

        it('remover a etapa de menor início recalcula as datas do cronograma, e a ordem das outras é compactada', async () => {
            const { cronograma } = await novoCronograma();
            const e1 = await criarEtapaPS(ps, cronograma, { inicio_previsto: '2031-01-01', termino_previsto: '2031-12-31' });
            const e2 = await criarEtapaPS(ps, cronograma, { inicio_previsto: '2031-03-01', termino_previsto: '2031-04-01' });
            const e3 = await criarEtapaPS(ps, cronograma, { inicio_previsto: '2031-05-01', termino_previsto: '2031-06-01' });

            assertStatus(await cliente.delete(`/api/plano-setorial-etapa/${e1}`), 202);
            const c = await crono(cronograma);
            assert.equal(ymd(c.inicio_previsto), '2031-03-01');
            assert.equal(ymd(c.termino_previsto), '2031-06-01');

            const linhas = await lista(cronograma);
            assert.deepEqual(
                linhas.map((l) => [l.etapa_id, l.ordem]),
                [
                    [e2, 1],
                    [e3, 2],
                ]
            );
        });

        it('inativar a etapa no cronograma a exclui das datas do cronograma e da contagem consolidada', async () => {
            const { meta, cronograma } = await novoCronograma();
            const e1 = await criarEtapaPS(ps, cronograma, { inicio_previsto: '2031-01-01', termino_previsto: '2031-02-01' });
            const e2 = await criarEtapaPS(ps, cronograma, { inicio_previsto: '2031-06-01', termino_previsto: '2031-07-01' });
            await prisma().$queryRaw`select refresh_ps_meta_consolidado(${meta}::int)`;
            const antes = await prisma().psDashboardConsolidado.findFirstOrThrow({ where: { meta_id: meta, tipo: 'meta' } });
            assert.equal(antes.cronograma_total, 2);

            const inativa = await cliente
                .post('/api/plano-setorial-cronograma-etapa')
                .send({ cronograma_id: cronograma, etapa_id: e1, inativo: true });
            assertStatus(inativa, 201);
            const c = await crono(cronograma);
            assert.equal(ymd(c.inicio_previsto), '2031-06-01');
            assert.equal(ymd(c.termino_previsto), '2031-07-01');

            await prisma().$queryRaw`select refresh_ps_meta_consolidado(${meta}::int)`;
            const depois = await prisma().psDashboardConsolidado.findFirstOrThrow({ where: { meta_id: meta, tipo: 'meta' } });
            assert.equal(depois.cronograma_total, 1);

            assert.deepEqual(
                (await lista(cronograma, '&inativo=false')).map((l) => l.etapa_id),
                [e2]
            );
            assertStatus(
                await cliente
                    .post('/api/plano-setorial-cronograma-etapa')
                    .send({ cronograma_id: cronograma, etapa_id: e1, inativo: false }),
                201
            );
            assert.equal(ymd((await crono(cronograma)).inicio_previsto), '2031-01-01');
        });
    });

    describe('ordem das etapas, fases e subfases', () => {
        it('cada nível tem a própria sequência de ordem, e mover empurra só os irmãos do mesmo pai', async () => {
            const { cronograma } = await novoCronograma();
            const e1 = await criarEtapaPS(ps, cronograma);
            const e2 = await criarEtapaPS(ps, cronograma);
            const f1 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e1 });
            const f2 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e1 });
            const f3 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e1 });
            const g1 = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e2 });

            const ordens = async () => {
                const rows = await prisma().cronogramaEtapa.findMany({
                    where: { cronograma_id: cronograma },
                    select: { etapa_id: true, ordem: true, nivel: true },
                });
                return new Map(rows.map((r) => [r.etapa_id, r]));
            };
            const antes = await ordens();
            assert.deepEqual([e1, e2].map((x) => antes.get(x)!.ordem), [1, 2]);
            assert.deepEqual([f1, f2, f3].map((x) => antes.get(x)!.ordem), [1, 2, 3]);
            assert.equal(antes.get(g1)!.ordem, 1);
            assert.equal(antes.get(e1)!.nivel, 'Etapa');
            assert.equal(antes.get(f1)!.nivel, 'Fase');

            assertStatus(
                await cliente
                    .post('/api/plano-setorial-cronograma-etapa')
                    .send({ cronograma_id: cronograma, etapa_id: f3, ordem: 1 }),
                201
            );
            const depois = await ordens();
            assert.deepEqual([f3, f1, f2].map((x) => depois.get(x)!.ordem), [1, 2, 3]);
            assert.deepEqual([e1, e2].map((x) => depois.get(x)!.ordem), [1, 2]);
            assert.equal(depois.get(g1)!.ordem, 1);

            const linhas = await lista(cronograma);
            const topo = linhas.find((l) => l.etapa_id === e1)!;
            assert.deepEqual(
                topo.etapa.etapa_filha.map((x) => x.etapa_id),
                [f3, f1, f2]
            );
        });

        it('ordem menor ou igual a zero vira 1 e ordem acima do máximo cai no fim', async () => {
            const { cronograma } = await novoCronograma();
            const a = await criarEtapaPS(ps, cronograma);
            const b = await criarEtapaPS(ps, cronograma);
            const c = await criarEtapaPS(ps, cronograma);

            assertStatus(
                await cliente
                    .post('/api/plano-setorial-cronograma-etapa')
                    .send({ cronograma_id: cronograma, etapa_id: c, ordem: -5 }),
                201
            );
            assert.deepEqual(
                (await lista(cronograma)).map((l) => l.etapa_id),
                [c, a, b]
            );

            assertStatus(
                await cliente
                    .post('/api/plano-setorial-cronograma-etapa')
                    .send({ cronograma_id: cronograma, etapa_id: c, ordem: 99 }),
                201
            );
            const ordenadas = await lista(cronograma);
            assert.equal(ordenadas.at(-1)!.etapa_id, c);
        });

        it(
            'mover para ordem acima do máximo mantém a sequência sem lacunas',
            { todo: 'BUG: ordem acima do máximo usa último+1 contando a própria etapa e deixa lacuna (cronograma-etapas.service.ts:593)' },
            async () => {
                const { cronograma } = await novoCronograma();
                const a = await criarEtapaPS(ps, cronograma);
                await criarEtapaPS(ps, cronograma);
                await criarEtapaPS(ps, cronograma);
                assertStatus(
                    await cliente
                        .post('/api/plano-setorial-cronograma-etapa')
                        .send({ cronograma_id: cronograma, etapa_id: a, ordem: 99 }),
                    201
                );
                assert.deepEqual(
                    (await lista(cronograma)).map((l) => l.ordem),
                    [1, 2, 3]
                );
            }
        );
    });

    describe('atraso', () => {
        const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
        const diasAFrente = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

        it('classifica o grau pelo atraso em dias e etapa concluída vira Concluido', async () => {
            const { cronograma } = await novoCronograma();
            const neutro = await criarEtapaPS(ps, cronograma, {
                inicio_previsto: diasAtras(10),
                termino_previsto: diasAFrente(10),
            });
            const moderado = await criarEtapaPS(ps, cronograma, {
                inicio_previsto: diasAtras(40),
                termino_previsto: diasAFrente(10),
            });
            const alto = await criarEtapaPS(ps, cronograma, {
                inicio_previsto: diasAtras(90),
                termino_previsto: diasAFrente(10),
            });
            const futuro = await criarEtapaPS(ps, cronograma, {
                inicio_previsto: diasAFrente(5),
                termino_previsto: diasAFrente(10),
            });
            const concluido = await criarEtapaPS(ps, cronograma, {
                inicio_previsto: diasAtras(90),
                termino_previsto: diasAtras(60),
                inicio_real: diasAtras(80),
                termino_real: diasAtras(50),
            });
            const terminoAtrasado = await criarEtapaPS(ps, cronograma, {
                inicio_previsto: diasAtras(100),
                termino_previsto: diasAtras(70),
                inicio_real: diasAtras(95),
            });

            const por = new Map((await lista(cronograma)).map((l) => [l.etapa_id, l.etapa]));
            assert.equal(por.get(neutro)!.atraso_grau, 'Neutro');
            assert.ok(por.get(neutro)!.atraso! >= 10 && por.get(neutro)!.atraso! <= 11);
            assert.equal(por.get(moderado)!.atraso_grau, 'Moderado');
            assert.equal(por.get(alto)!.atraso_grau, 'Alto');
            assert.equal(por.get(futuro)!.atraso, null);
            assert.equal(por.get(futuro)!.atraso_grau, 'Neutro');
            assert.equal(por.get(concluido)!.atraso, 0);
            assert.equal(por.get(concluido)!.atraso_grau, 'Concluido');
            assert.equal(por.get(terminoAtrasado)!.atraso_grau, 'Alto', 'com início real o atraso conta pelo término previsto');
        });

        it('adiar o término previsto de uma etapa iniciada tira o atraso', async () => {
            const { cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma, {
                inicio_previsto: diasAtras(100),
                termino_previsto: diasAtras(70),
                inicio_real: diasAtras(95),
            });
            const antes = (await lista(cronograma))[0].etapa;
            assert.equal(antes.atraso_grau, 'Alto');

            assertStatus(await patch(e, { termino_previsto: diasAFrente(30) }), 200);
            const depois = (await lista(cronograma))[0].etapa;
            assert.equal(depois.atraso, null);
            assert.equal(depois.atraso_grau, 'Neutro');
        });

        it('o atraso mais severo de fases e subfases aparece no cronograma', async () => {
            const { meta, cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma);
            const f = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e });
            await criarEtapaPS(ps, cronograma, {
                etapa_pai_id: f,
                inicio_previsto: diasAtras(90),
                termino_previsto: diasAFrente(5),
            });
            const res = await cliente.get(`/api/plano-setorial-cronograma?meta_id=${meta}`);
            assertStatus(res, 200);
            assert.equal(res.body.linhas[0].atraso_grau, 'Alto');
        });

        it(
            'o atraso mais severo considera todas as etapas de topo, não só a última',
            { todo: 'BUG: getAtrasoMaisSevero sobrescreve a severidade a cada etapa de topo (cronograma-etapas.service.ts:890)' },
            async () => {
                const { meta, cronograma } = await novoCronograma();
                await criarEtapaPS(ps, cronograma, {
                    inicio_previsto: diasAtras(40),
                    termino_previsto: diasAFrente(5),
                });
                await criarEtapaPS(ps, cronograma, {
                    inicio_previsto: diasAFrente(5),
                    termino_previsto: diasAFrente(10),
                });
                const res = await cliente.get(`/api/plano-setorial-cronograma?meta_id=${meta}`);
                assert.equal(res.body.linhas[0].atraso_grau, 'Moderado');
            }
        );
    });

    describe('endereço obrigatório', () => {
        it('400 ao informar término real sem endereço, e a etapa não é alterada', async () => {
            const { cronograma } = await novoCronograma();
            const e = await criarEtapaPS(ps, cronograma, { endereco_obrigatorio: true, inicio_real: '2031-01-01' });
            const res = await patch(e, { termino_real: '2031-02-01' });
            assertStatus(res, 400);
            assert.match(res.body.message, /Endereço é obrigatório para adicionar a data de término/);
            assert.equal((await etapa(e)).termino_real, null);
        });

        it('400 ao finalizar a fase se a etapa pai exige endereço e não tem, citando a etapa pai', async () => {
            const { cronograma } = await novoCronograma();
            const titulo = uniq('Pai com endereço');
            const e = await criarEtapaPS(ps, cronograma, { titulo, endereco_obrigatorio: true });
            const f = await criarEtapaPS(ps, cronograma, { etapa_pai_id: e, inicio_real: '2031-01-01' });
            const res = await patch(f, { termino_real: '2031-02-01' });
            assertStatus(res, 400);
            assert.match(res.body.message, /precisam ter o endereço preenchido/);
            assert.ok(res.body.message.includes(titulo));
            assert.equal((await etapa(f)).termino_real, null);
        });
    });
});
