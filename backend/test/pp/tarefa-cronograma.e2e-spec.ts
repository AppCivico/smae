import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, prisma } from '../lib';
import { periodo, periodoReal, somaDias, Tipo } from './_helpers';
import { Cronograma, novoCronograma, ymd } from './_cronograma';

for (const tipo of ['PP', 'MDO'] as Tipo[]) {
    describe(`tarefa cronograma (${tipo}): rollup e hierarquia`, () => {
        before(async () => {
            await bootApp();
        });

        it('pai agrega datas, duração, custos e percentual ponderado das filhas, e o cronograma agrega os pais', async () => {
            const c = await novoCronograma(tipo);
            const pai = await c.criar({ tarefa: 'Pai' });
            const f1 = await c.criar({
                nivel: 2,
                tarefa_pai_id: pai.id,
                ...periodo('2030-01-01', 10),
                custo_estimado: 100,
            });
            const f2 = await c.criar({
                nivel: 2,
                numero: 2,
                tarefa_pai_id: pai.id,
                ...periodo('2030-01-11', 30),
                custo_estimado: 50.5,
            });

            let p = await c.ler(pai.id);
            assert.equal(p.n_filhos_imediatos, 2);
            assert.equal(p.inicio_planejado, '2030-01-01');
            assert.equal(p.termino_planejado, '2030-02-09');
            assert.equal(p.duracao_planejado, 40);
            assert.equal(Number(p.custo_estimado), 150.5);
            assert.equal(p.percentual_concluido, 0);

            let cr = await c.cronograma();
            assert.equal(ymd(cr.previsao_inicio), '2030-01-01');
            assert.equal(ymd(cr.previsao_termino), '2030-02-09');
            assert.equal(cr.previsao_duracao, 39);
            assert.equal(cr.previsao_custo, 150.5);

            await c.editar(f1.id, { ...periodoReal('2030-01-01', 10), percentual_concluido: 100 });
            p = await c.ler(pai.id);
            // 10 dias a 100% e 30 dias a 0% => 25%
            assert.equal(p.percentual_concluido, 25);
            assert.equal(p.inicio_real, '2030-01-01');
            assert.equal(p.termino_real, null);

            await c.editar(f2.id, { ...periodoReal('2030-01-12', 30), percentual_concluido: 50 });
            p = await c.ler(pai.id);
            // (10*100 + 30*50) / 40 = 62.5
            assert.equal(p.percentual_concluido, 63);
            assert.equal(p.inicio_real, '2030-01-01');
            assert.equal(p.termino_real, '2030-02-10');
            assert.equal(p.duracao_real, 41);

            cr = await c.cronograma();
            assert.equal(ymd(cr.realizado_inicio), '2030-01-01');
            assert.equal(ymd(cr.realizado_termino), '2030-02-10');
            assert.equal(cr.percentual_concluido, 63);
        });

        it('pai nunca aceita edição direta de realizado, percentual ou datas planejadas com dependências', async () => {
            const c = await novoCronograma(tipo);
            const pai = await c.criar();
            await c.criar({ nivel: 2, tarefa_pai_id: pai.id, ...periodo('2030-03-01', 5) });
            for (const campo of [{ percentual_concluido: 10 }, periodoReal('2030-03-01', 2)]) {
                const res = await c.editar(pai.id, campo, 400);
                assert.match(res.message, /não pode ser alterad[oa] diretamente/);
            }
        });

        it('mover, alterar datas e apagar filha recalcula o pai antigo e o novo', async () => {
            const c = await novoCronograma(tipo);
            const paiA = await c.criar({ tarefa: 'A' });
            const paiB = await c.criar({ tarefa: 'B', numero: 2 });
            const a1 = await c.criar({ nivel: 2, tarefa_pai_id: paiA.id, ...periodo('2030-04-01', 10) });
            const a2 = await c.criar({ nivel: 2, numero: 2, tarefa_pai_id: paiA.id, ...periodo('2030-04-20', 5) });
            const b1 = await c.criar({ nivel: 2, tarefa_pai_id: paiB.id, ...periodo('2030-06-01', 3) });

            assert.equal((await c.ler(paiA.id)).termino_planejado, '2030-04-24');

            await c.editar(a2.id, { tarefa_pai_id: paiB.id, nivel: 2, numero: 1 });
            const a = await c.ler(paiA.id);
            const b = await c.ler(paiB.id);
            assert.equal(a.n_filhos_imediatos, 1);
            assert.equal(a.termino_planejado, '2030-04-10');
            assert.equal(a.duracao_planejado, 10);
            assert.equal(b.n_filhos_imediatos, 2);
            assert.equal(b.inicio_planejado, '2030-04-20');
            assert.equal(b.termino_planejado, '2030-06-03');

            await c.editar(b1.id, periodo('2030-07-01', 10));
            assert.equal((await c.ler(paiB.id)).termino_planejado, '2030-07-10');

            await c.apagar(b1.id);
            const b2 = await c.ler(paiB.id);
            assert.equal(b2.n_filhos_imediatos, 1);
            assert.equal(b2.termino_planejado, '2030-04-24');

            const cr = await c.cronograma();
            assert.equal(ymd(cr.previsao_inicio), '2030-04-01');
            assert.equal(ymd(cr.previsao_termino), '2030-04-24');
            assert.ok(a1.id);
        });

        it('apagar a última filha deixa o pai folha de novo e o pai volta a aceitar edição direta', async () => {
            const c = await novoCronograma(tipo);
            const pai = await c.criar();
            const f = await c.criar({ nivel: 2, tarefa_pai_id: pai.id, ...periodo('2030-05-01', 4) });
            assert.equal((await c.ler(pai.id)).n_filhos_imediatos, 1);
            await c.apagar(f.id);
            const p = await c.ler(pai.id);
            assert.equal(p.n_filhos_imediatos, 0);
            assert.equal(p.inicio_planejado, null);
            assert.equal(p.duracao_planejado, null);
            await c.editar(pai.id, periodo('2030-05-10', 2));
            assert.equal((await c.ler(pai.id)).termino_planejado, '2030-05-11');
        });

        it('custo anualizado da tarefa vira custo_estimado pela trigger e entra no pai', async () => {
            const c = await novoCronograma(tipo);
            const pai = await c.criar();
            const f = await c.criar({
                nivel: 2,
                tarefa_pai_id: pai.id,
                ...periodo('2030-01-01', 10),
                custo_estimado_anualizado: [{ ano: 2030, valor: 100 }],
            });
            await c.editar(f.id, { custo_estimado_anualizado: [{ ano: 2030, valor: 100 }, { ano: 2031, valor: 25.5 }] }, 400);
            await c.editar(f.id, {
                ...periodo('2030-12-25', 10),
                custo_estimado_anualizado: [{ ano: 2030, valor: 100 }, { ano: 2031, valor: 25.5 }],
            });
            const t = await c.ler(f.id);
            assert.equal(Number(t.custo_estimado), 125.5);
            assert.equal(Number((await c.ler(pai.id)).custo_estimado), 125.5);
        });

        it('validações de datas e duração', async () => {
            const c = await novoCronograma(tipo);
            await c.criar({ inicio_planejado: '2030-01-01' }, 400);
            await c.criar({ ...periodo('2030-01-01', 5), duracao_planejado: 6 }, 400);
            await c.criar({ inicio_planejado: '2030-01-10', termino_planejado: '2030-01-01', duracao_planejado: 1 }, 400);
            await c.criar({ ...periodoReal('2030-01-10', 3), termino_real: '2030-01-01' }, 400);
            const t = await c.criar(periodo('2030-01-01', 5));
            const res = await c.editar(t.id, { inicio_planejado: '2030-01-01' }, 400);
            assert.match(JSON.stringify(res.message), /três propriedades/);
        });

        it('filha sem duração impede o percentual e o término do pai, e o ano_orcamento do projeto acompanha as datas', async () => {
            const c = await novoCronograma(tipo);
            const pai = await c.criar();
            const comDatas = await c.criar({ nivel: 2, tarefa_pai_id: pai.id, ...periodo('2035-06-01', 10) });
            await c.criar({ nivel: 2, numero: 2, tarefa_pai_id: pai.id });
            await c.editar(comDatas.id, { percentual_concluido: 100 });

            const p = await c.ler(pai.id);
            assert.equal(p.percentual_concluido, null);
            assert.equal(p.termino_planejado, null);
            assert.equal(p.inicio_planejado, '2035-06-01');
            assert.equal((await c.cronograma()).previsao_termino, null);

            const anos = async () =>
                (await prisma().projeto.findUniqueOrThrow({ where: { id: c.projeto_id }, select: { ano_orcamento: true } }))
                    .ano_orcamento;
            assert.ok((await anos()).includes(2035));

            await c.editar(comDatas.id, periodo('2037-12-25', 10));
            const depois = await anos();
            assert.ok(depois.includes(2037) && depois.includes(2038));
            assert.ok(!depois.includes(2035));
        });
    });
}
