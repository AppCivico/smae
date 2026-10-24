import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, prisma } from '../lib';
import { periodo, somaDias, Tipo } from './_helpers';
import { novoCronograma, ymd } from './_cronograma';

const dep = (dependencia_tarefa_id: number, tipo: string, latencia = 0) => ({ dependencia_tarefa_id, tipo, latencia });

for (const tipo of ['PP', 'MDO'] as Tipo[]) {
    describe(`tarefa dependências (${tipo})`, () => {
        before(async () => {
            await bootApp();
        });

        it('termina_pro_inicio com latência: datas calculadas, flags e contadores', async () => {
            const c = await novoCronograma(tipo);
            const pred = await c.criar(periodo('2031-01-01', 10));
            const suc = await c.criar({
                numero: 2,
                duracao_planejado: 5,
                dependencias: [dep(pred.id, 'termina_pro_inicio', 2)],
            });
            const s = await c.ler(suc.id);
            assert.equal(s.inicio_planejado, '2031-01-12');
            assert.equal(s.termino_planejado, '2031-01-16');
            assert.equal(s.duracao_planejado, 5);
            assert.equal(s.inicio_planejado_calculado, true);
            assert.equal(s.termino_planejado_calculado, false);
            assert.equal(s.n_dep_inicio_planejado, 1);
            assert.equal(s.n_dep_termino_planejado, 0);
            assert.deepEqual(s.dependencias, [
                { dependencia_tarefa_id: pred.id, tipo: 'termina_pro_inicio', latencia: 2 },
            ]);
        });

        it('mudar a predecessora desloca a cadeia de sucessoras pela trigger', async () => {
            const c = await novoCronograma(tipo);
            const a = await c.criar(periodo('2031-02-01', 10));
            const b = await c.criar({ numero: 2, duracao_planejado: 5, dependencias: [dep(a.id, 'termina_pro_inicio', 0)] });
            const d = await c.criar({ numero: 3, duracao_planejado: 3, dependencias: [dep(b.id, 'termina_pro_inicio', 1)] });

            assert.equal((await c.ler(b.id)).inicio_planejado, '2031-02-10');
            assert.equal((await c.ler(d.id)).inicio_planejado, '2031-02-15');

            await c.editar(a.id, periodo('2031-03-01', 20));
            const nb = await c.ler(b.id);
            const nd = await c.ler(d.id);
            assert.equal(nb.inicio_planejado, '2031-03-20');
            assert.equal(nb.termino_planejado, '2031-03-24');
            assert.equal(nd.inicio_planejado, '2031-03-25');
            assert.equal(nd.termino_planejado, '2031-03-27');

            const cr = await c.cronograma();
            assert.equal(ymd(cr.previsao_inicio), '2031-03-01');
            assert.equal(ymd(cr.previsao_termino), '2031-03-27');
        });

        it('inicia_pro_inicio e termina_pro_termino com várias predecessoras: vale a mais tardia', async () => {
            const c = await novoCronograma(tipo);
            const p1 = await c.criar(periodo('2031-04-01', 10));
            const p2 = await c.criar({ numero: 2, ...periodo('2031-04-05', 20) });
            const suc = await c.criar({
                numero: 3,
                duracao_planejado: 3,
                dependencias: [dep(p1.id, 'inicia_pro_inicio', 0), dep(p2.id, 'inicia_pro_inicio', 3)],
            });
            let s = await c.ler(suc.id);
            assert.equal(s.inicio_planejado, '2031-04-08');
            assert.equal(s.n_dep_inicio_planejado, 2);

            await c.editar(suc.id, {
                dependencias: [dep(p1.id, 'termina_pro_termino', 0), dep(p2.id, 'termina_pro_termino', 0)],
            });
            s = await c.ler(suc.id);
            assert.equal(s.termino_planejado, '2031-04-24');
            assert.equal(s.termino_planejado_calculado, true);
            assert.equal(s.inicio_planejado_calculado, false);
            assert.equal(s.n_dep_inicio_planejado, 0);
            assert.equal(s.n_dep_termino_planejado, 2);
        });

        it('remover as dependências zera flags e contadores e mantém as datas atuais', async () => {
            const c = await novoCronograma(tipo);
            const a = await c.criar(periodo('2031-05-01', 5));
            const b = await c.criar({ numero: 2, duracao_planejado: 2, dependencias: [dep(a.id, 'termina_pro_inicio', 0)] });
            await c.editar(b.id, { dependencias: [] });
            const s = await c.ler(b.id);
            assert.equal(s.inicio_planejado_calculado, false);
            assert.equal(s.n_dep_inicio_planejado, 0);
            assert.deepEqual(s.dependencias, []);
            assert.equal(s.inicio_planejado, '2031-05-05');
            const n = await prisma().tarefaDependente.count({ where: { tarefa_id: b.id } });
            assert.equal(n, 0);
        });

        it('rejeita ciclo direto e indireto, auto-dependência e dependência em ancestral', async () => {
            const c = await novoCronograma(tipo);
            const a = await c.criar(periodo('2031-06-01', 5));
            const b = await c.criar({ numero: 2, duracao_planejado: 2, dependencias: [dep(a.id, 'termina_pro_inicio')] });
            const d = await c.criar({ numero: 3, duracao_planejado: 2, dependencias: [dep(b.id, 'termina_pro_inicio')] });

            const direto = await c.editar(a.id, { dependencias: [dep(b.id, 'termina_pro_inicio')] }, 400);
            assert.match(direto.message, /referências circulares/);
            const indireto = await c.editar(a.id, { dependencias: [dep(d.id, 'inicia_pro_inicio')] }, 400);
            assert.match(indireto.message, /referências circulares/);
            const propria = await c.editar(a.id, { dependencias: [dep(a.id, 'termina_pro_inicio')] }, 400);
            assert.match(propria.message, /própria tarefa/);

            const pai = await c.criar({ numero: 4 });
            const filha = await c.criar({ nivel: 2, tarefa_pai_id: pai.id, ...periodo('2031-07-01', 3) });
            const anc = await c.editar(filha.id, { dependencias: [dep(pai.id, 'termina_pro_inicio')] }, 400);
            assert.match(anc.message, /tarefa superior/);

            const nenhum = await prisma().tarefaDependente.count({ where: { tarefa_id: a.id } });
            assert.equal(nenhum, 0);
        });

        it('intervalo negativo calculado pelas dependências é rejeitado', async () => {
            const c = await novoCronograma(tipo);
            const a = await c.criar(periodo('2031-08-10', 10));
            const b = await c.criar({ numero: 2, ...periodo('2031-08-01', 3) });
            const res = await c.criar(
                {
                    numero: 3,
                    dependencias: [dep(a.id, 'termina_pro_inicio', 0), dep(b.id, 'termina_pro_termino', 0)],
                },
                400
            );
            assert.match(res.body.message, /intervalo ficou negativo/);
        });

        it('apagar predecessora é bloqueado até remover a dependência; depois a sucessora fica sem contador', async () => {
            const c = await novoCronograma(tipo);
            const a = await c.criar(periodo('2031-09-01', 5));
            const b = await c.criar({ numero: 2, duracao_planejado: 2, dependencias: [dep(a.id, 'termina_pro_inicio')] });
            const res = await api(c.sessao).delete(`${c.base}/tarefa/${a.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /remova primeiro a dependência/);

            await c.editar(b.id, { dependencias: [] });
            await c.apagar(a.id);
            assert.equal((await c.ler(b.id)).n_dep_inicio_planejado, 0);
        });

        it('pai com filhas não aceita dependências, e tarefa com dependências não vira pai', async () => {
            const c = await novoCronograma(tipo);
            const alvo = await c.criar(periodo('2031-10-01', 5));
            const pai = await c.criar({ numero: 2 });
            await c.criar({ nivel: 2, tarefa_pai_id: pai.id, ...periodo('2031-10-10', 2) });
            const r = await c.editar(pai.id, { dependencias: [dep(alvo.id, 'termina_pro_inicio')] }, 400);
            assert.match(r.message, /Não podem existir dependencias nesta tarefa/);

            const comDep = await c.criar({ numero: 3, duracao_planejado: 2, dependencias: [dep(alvo.id, 'termina_pro_inicio')] });
            const f = await c.criar({ nivel: 2, tarefa_pai_id: comDep.id }, 400);
            assert.match(f.body.message, /Remova primeiro as dependências/);
        });

        it('POST /dependencias calcula as datas sem gravar e rejeita ciclo', async () => {
            const c = await novoCronograma(tipo);
            const a = await c.criar(periodo('2031-11-01', 10));
            const b = await c.criar({ numero: 2, duracao_planejado: 2, dependencias: [dep(a.id, 'termina_pro_inicio')] });

            const ok = await api(c.sessao)
                .post(`${c.base}/dependencias`)
                .send({ tarefa_corrente_id: null, dependencias: [dep(a.id, 'termina_pro_inicio', 5)] });
            assertStatus(ok, 201);
            assert.equal(ok.body.inicio_planejado.slice(0, 10), '2031-11-15');
            assert.equal(ok.body.inicio_planejado_calculado, true);
            assert.equal(ok.body.termino_planejado_calculado, false);

            const ciclo = await api(c.sessao)
                .post(`${c.base}/dependencias`)
                .send({ tarefa_corrente_id: a.id, dependencias: [dep(b.id, 'termina_pro_inicio')] });
            assertStatus(ciclo, 400);
            assert.equal((await c.ler(b.id)).inicio_planejado, '2031-11-10');

            const vazio = await api(c.sessao).post(`${c.base}/dependencias`).send({ tarefa_corrente_id: a.id, dependencias: [] });
            assertStatus(vazio, 400);
        });
    });
}
