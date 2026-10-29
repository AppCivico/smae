import { before, describe, it } from 'node:test';
import { RefreshMetaService } from '../../src/task/refresh_meta/refresh-meta.service';
import { api, assert, assertStatus, bootApp, criarPlanoSetorial, getApp, prisma, Sessao } from '../lib';
import {
    criarAtividadePS,
    criarCronogramaPS,
    criarEtapaPS,
    criarIniciativaPS,
    criarMetaPS,
    gestorPS,
} from '../pdm/_helpers';

const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const diasAFrente = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

describe('meta: consolidação de cronograma (ps_dashboard_consolidado)', () => {
    let ps: Sessao;
    let cliente: ReturnType<typeof api>;
    let planoId: number;

    before(async () => {
        await bootApp();
        ps = await gestorPS();
        cliente = api(ps, { sistema: 'PlanoSetorial' });
        planoId = (await criarPlanoSetorial({ sistema: 'PlanoSetorial' })).id;
    });

    const refresh = async (meta: number) => {
        await prisma().$queryRaw`select refresh_ps_meta_consolidado(${meta}::int)`;
    };
    const linha = async (meta: number, tipo: 'meta' | 'iniciativa' | 'atividade') => {
        const rows = await prisma().psDashboardConsolidado.findMany({ where: { meta_id: meta, tipo } });
        assert.ok(rows.length <= 1);
        return rows[0] ?? null;
    };
    const tarefas = async (meta: number) => {
        const r = await prisma().$queryRaw<{ n: bigint }[]>`
            select count(*) n from task_queue where type = 'refresh_meta' and (params->>'meta_id')::int = ${meta}`;
        return Number(r[0].n);
    };
    const patchEtapa = (id: number, dados: Record<string, unknown>) =>
        cliente.patch(`/api/plano-setorial-etapa/${id}`).send(dados);

    async function arvore() {
        const meta = await criarMetaPS(ps, planoId);
        const iniciativa = await criarIniciativaPS(ps, meta);
        const atividade = await criarAtividadePS(ps, iniciativa);
        const cMeta = await criarCronogramaPS(ps, { meta_id: meta });
        const cIni = await criarCronogramaPS(ps, { iniciativa_id: iniciativa });
        const cAtv = await criarCronogramaPS(ps, { atividade_id: atividade });
        return { meta, iniciativa, atividade, cMeta, cIni, cAtv };
    }

    describe('árvore meta > iniciativa > atividade', () => {
        it('cada nível recebe a própria linha consolidada e conta só as folhas do próprio cronograma', async () => {
            const t = await arvore();
            await criarEtapaPS(ps, t.cMeta);
            await criarEtapaPS(ps, t.cMeta);
            const e = await criarEtapaPS(ps, t.cIni);
            await criarEtapaPS(ps, t.cIni, { etapa_pai_id: e });
            await criarEtapaPS(ps, t.cIni, { etapa_pai_id: e });
            const ea = await criarEtapaPS(ps, t.cAtv);
            const fa = await criarEtapaPS(ps, t.cAtv, { etapa_pai_id: ea });
            await criarEtapaPS(ps, t.cAtv, { etapa_pai_id: fa });

            await refresh(t.meta);

            const m = await linha(t.meta, 'meta');
            const i = await linha(t.meta, 'iniciativa');
            const a = await linha(t.meta, 'atividade');
            assert.ok(m && i && a);
            assert.equal(m.item_id, t.meta);
            assert.equal(i.item_id, t.iniciativa);
            assert.equal(i.iniciativa_id, t.iniciativa);
            assert.equal(a.item_id, t.atividade);
            assert.equal(a.atividade_id, t.atividade);
            assert.equal(m.cronograma_total, 2);
            assert.equal(i.cronograma_total, 2, 'a etapa com filhas não conta, só as 2 fases');
            assert.equal(a.cronograma_total, 1, 'só a subfase é folha');
            for (const l of [m, i, a]) assert.equal(l.pdm_id, planoId);
        });

        it('views de relacionamento ligam etapa, cronograma, iniciativa e atividade à meta', async () => {
            const t = await arvore();
            const eMeta = await criarEtapaPS(ps, t.cMeta);
            const eAtv = await criarEtapaPS(ps, t.cAtv);
            const fAtv = await criarEtapaPS(ps, t.cAtv, { etapa_pai_id: eAtv });

            const cronogramas = await prisma().view_meta_cronograma.findMany({ where: { meta_id: t.meta } });
            assert.deepEqual(cronogramas.map((c) => c.cronograma_id).sort(), [t.cMeta, t.cIni, t.cAtv].sort());

            const rel = await prisma().view_etapa_rel_meta.findMany({ where: { etapa_id: { in: [eMeta, fAtv] } } });
            const relMeta = rel.find((r) => r.etapa_id === eMeta)!;
            assert.deepEqual([relMeta.meta_id, relMeta.iniciativa_id, relMeta.atividade_id], [t.meta, null, null]);
            const relAtv = rel.find((r) => r.etapa_id === fAtv)!;
            assert.deepEqual(
                [relAtv.meta_id, relAtv.iniciativa_id, relAtv.atividade_id],
                [t.meta, t.iniciativa, t.atividade]
            );

            const folhas = await prisma().$queryRaw<{ id: number }[]>`select id from view_meta_etapa_sem_filhos where meta_id = ${t.meta}`;
            assert.deepEqual(folhas.map((f) => f.id).sort(), [eMeta, fAtv].sort());
        });

        it('remover a iniciativa tira a linha dela e a das atividades filhas do consolidado', async () => {
            const t = await arvore();
            await criarEtapaPS(ps, t.cIni);
            await refresh(t.meta);
            assert.ok(await linha(t.meta, 'iniciativa'));
            assert.ok(await linha(t.meta, 'atividade'));

            const bloqueada = await cliente.delete(`/api/plano-setorial-atividade/${t.atividade}`);
            assertStatus(bloqueada, 400);
            assert.match(bloqueada.body.message, /cronogramas ativos/);
            assertStatus(await cliente.delete(`/api/plano-setorial-cronograma/${t.cAtv}`), 202);
            assertStatus(await cliente.delete(`/api/plano-setorial-atividade/${t.atividade}`), 202);
            await refresh(t.meta);
            assert.equal(await linha(t.meta, 'atividade'), null);
            assert.ok(await linha(t.meta, 'iniciativa'));

            assertStatus(await cliente.delete(`/api/plano-setorial-iniciativa/${t.iniciativa}`), 400);
            assertStatus(await cliente.delete(`/api/plano-setorial-cronograma/${t.cIni}`), 202);
            assertStatus(await cliente.delete(`/api/plano-setorial-iniciativa/${t.iniciativa}`), 202);
            await refresh(t.meta);
            assert.equal(await linha(t.meta, 'iniciativa'), null);
            assert.ok(await linha(t.meta, 'meta'));
        });

        it('remover o cronograma da iniciativa zera o total dela sem afetar os outros níveis', async () => {
            const t = await arvore();
            await criarEtapaPS(ps, t.cMeta);
            await criarEtapaPS(ps, t.cIni);
            await refresh(t.meta);
            assert.equal((await linha(t.meta, 'iniciativa'))!.cronograma_total, 1);

            assertStatus(await cliente.delete(`/api/plano-setorial-cronograma/${t.cIni}`), 202);
            await refresh(t.meta);
            assert.equal((await linha(t.meta, 'iniciativa'))!.cronograma_total, 0);
            assert.equal((await linha(t.meta, 'meta'))!.cronograma_total, 1);
            const views = await prisma().view_meta_cronograma.findMany({ where: { meta_id: t.meta } });
            assert.ok(!views.some((v) => v.cronograma_id === t.cIni));
        });
    });

    describe('atrasos e pendências do cronograma', () => {
        it('início atrasado, término atrasado e concluída movem os contadores e a pendência', async () => {
            const { meta, cMeta } = await arvore();
            const e = await criarEtapaPS(ps, cMeta, {
                inicio_previsto: diasAtras(20),
                termino_previsto: diasAtras(5),
            });
            await criarEtapaPS(ps, cMeta, { inicio_previsto: diasAFrente(5), termino_previsto: diasAFrente(9) });

            await refresh(meta);
            let l = (await linha(meta, 'meta'))!;
            assert.deepEqual(
                [l.cronograma_total, l.cronograma_atraso_inicio, l.cronograma_atraso_fim, l.cronograma_preenchido],
                [2, 1, 0, 1]
            );
            assert.equal(l.pendencia_cronograma, true);
            assert.equal(l.pendente_cronograma, true);
            assert.equal(l.pendente, true);

            assertStatus(await patchEtapa(e, { inicio_real: diasAtras(18) }), 200);
            await refresh(meta);
            l = (await linha(meta, 'meta'))!;
            assert.deepEqual(
                [l.cronograma_atraso_inicio, l.cronograma_atraso_fim, l.cronograma_preenchido],
                [0, 1, 1]
            );
            assert.equal(l.pendente_cronograma, true);

            assertStatus(await patchEtapa(e, { termino_real: diasAtras(4) }), 200);
            await refresh(meta);
            l = (await linha(meta, 'meta'))!;
            assert.deepEqual(
                [l.cronograma_atraso_inicio, l.cronograma_atraso_fim, l.cronograma_preenchido],
                [0, 0, 2]
            );
            assert.equal(l.pendencia_cronograma, false);
            assert.equal(l.pendente_cronograma, false);
        });

        it('adiar o início previsto de uma folha atrasada tira a pendência de cronograma', async () => {
            const { meta, cMeta } = await arvore();
            const e = await criarEtapaPS(ps, cMeta, { inicio_previsto: diasAtras(10), termino_previsto: diasAFrente(10) });
            await refresh(meta);
            assert.equal((await linha(meta, 'meta'))!.pendente_cronograma, true);

            assertStatus(await patchEtapa(e, { inicio_previsto: diasAFrente(1) }), 200);
            await refresh(meta);
            const l = (await linha(meta, 'meta'))!;
            assert.equal(l.cronograma_atraso_inicio, 0);
            assert.equal(l.pendente_cronograma, false);
        });

        it('a pendência vem das folhas: fase atrasada conta, a etapa pai com datas esticadas não conta em dobro', async () => {
            const { meta, cMeta } = await arvore();
            const e = await criarEtapaPS(ps, cMeta);
            await criarEtapaPS(ps, cMeta, {
                etapa_pai_id: e,
                inicio_previsto: diasAtras(30),
                termino_previsto: diasAFrente(30),
            });
            await criarEtapaPS(ps, cMeta, {
                etapa_pai_id: e,
                inicio_previsto: diasAFrente(2),
                termino_previsto: diasAFrente(3),
            });
            await refresh(meta);
            const l = (await linha(meta, 'meta'))!;
            assert.deepEqual([l.cronograma_total, l.cronograma_atraso_inicio], [2, 1]);
        });

        it('etapa inativa no cronograma não gera pendência', async () => {
            const { meta, cMeta } = await arvore();
            const e = await criarEtapaPS(ps, cMeta, { inicio_previsto: diasAtras(10), termino_previsto: diasAFrente(10) });
            await refresh(meta);
            assert.equal((await linha(meta, 'meta'))!.cronograma_atraso_inicio, 1);

            assertStatus(
                await cliente
                    .post('/api/plano-setorial-cronograma-etapa')
                    .send({ cronograma_id: cMeta, etapa_id: e, inativo: true }),
                201
            );
            await refresh(meta);
            const l = (await linha(meta, 'meta'))!;
            assert.deepEqual([l.cronograma_total, l.cronograma_atraso_inicio, l.pendente_cronograma], [0, 0, false]);
        });
    });

    describe('fila de recálculo (task_queue refresh_meta)', () => {
        it('criar, editar, inativar e remover etapa enfileiram a meta da árvore, sem tocar nas outras', async () => {
            const t = await arvore();
            const outra = await criarMetaPS(ps, planoId);
            const outraAntes = await tarefas(outra);

            let antes = await tarefas(t.meta);
            const e = await criarEtapaPS(ps, t.cAtv);
            assert.ok((await tarefas(t.meta)) > antes, 'criar etapa de atividade enfileira a meta dona');

            antes = await tarefas(t.meta);
            assertStatus(await patchEtapa(e, { titulo: 'renomeada' }), 200);
            assert.ok((await tarefas(t.meta)) > antes, 'editar etapa');

            antes = await tarefas(t.meta);
            assertStatus(
                await cliente
                    .post('/api/plano-setorial-cronograma-etapa')
                    .send({ cronograma_id: t.cAtv, etapa_id: e, inativo: true }),
                201
            );
            assert.ok((await tarefas(t.meta)) > antes, 'inativar etapa no cronograma');

            antes = await tarefas(t.meta);
            assertStatus(await cliente.delete(`/api/plano-setorial-etapa/${e}`), 202);
            assert.ok((await tarefas(t.meta)) > antes, 'remover etapa');

            antes = await tarefas(t.meta);
            assertStatus(await cliente.delete(`/api/plano-setorial-cronograma/${t.cAtv}`), 202);
            assert.ok((await tarefas(t.meta)) > antes, 'remover cronograma');

            assert.equal(await tarefas(outra), outraAntes);
        });

        it('executar a tarefa mais recente atualiza o consolidado e descarta as tarefas antigas da meta', async () => {
            const t = await arvore();
            await criarEtapaPS(ps, t.cMeta, { inicio_previsto: diasAtras(3), termino_previsto: diasAFrente(3) });
            await criarEtapaPS(ps, t.cMeta, { inicio_previsto: diasAFrente(3), termino_previsto: diasAFrente(5) });
            assert.equal(await linha(t.meta, 'meta'), null, 'sem worker o consolidado ainda não existe');

            const pendentes = await prisma().task_queue.findMany({
                where: { type: 'refresh_meta', status: 'pending', params: { path: ['meta_id'], equals: t.meta } },
                orderBy: { id: 'asc' },
            });
            assert.ok(pendentes.length >= 2);
            const ultima = pendentes[pendentes.length - 1];

            await getApp().get(RefreshMetaService).executeJob({ meta_id: t.meta }, String(ultima.id));

            const l = (await linha(t.meta, 'meta'))!;
            assert.ok(l);
            assert.deepEqual([l.cronograma_total, l.cronograma_atraso_inicio], [2, 1]);

            const restantes = await prisma().task_queue.findMany({
                where: { id: { in: pendentes.map((p) => p.id) } },
                select: { id: true },
            });
            assert.deepEqual(
                restantes.map((r) => r.id),
                [ultima.id]
            );
        });
    });
});
