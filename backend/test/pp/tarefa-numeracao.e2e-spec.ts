import { before, describe, it } from 'node:test';
import { assert, bootApp, prisma } from '../lib';
import { Tipo } from './_helpers';
import { Cronograma, novoCronograma } from './_cronograma';

const numeros = async (c: Cronograma, ids: number[]) => {
    const h = await c.hierarquia();
    return ids.map((id) => h[id]);
};

for (const tipo of ['PP', 'MDO'] as Tipo[]) {
    describe(`tarefa numeração (${tipo})`, () => {
        before(async () => {
            await bootApp();
        });

        it('inserir em posição ocupada empurra as irmãs, e número acima do máximo vira o último', async () => {
            const c = await novoCronograma(tipo);
            const a = await c.criar({ numero: 1 });
            const b = await c.criar({ numero: 2 });
            const novaPrimeira = await c.criar({ numero: 1 });
            const ultima = await c.criar({ numero: 99 });
            assert.deepEqual(await numeros(c, [novaPrimeira.id, a.id, b.id, ultima.id]), ['1', '2', '3', '4']);
        });

        it('mudar o número reordena sem buracos nem duplicatas, nos dois sentidos', async () => {
            const c = await novoCronograma(tipo);
            const [t1, t2, t3, t4] = [
                await c.criar({ numero: 1 }),
                await c.criar({ numero: 2 }),
                await c.criar({ numero: 3 }),
                await c.criar({ numero: 4 }),
            ];
            const ids = [t1.id, t2.id, t3.id, t4.id];

            await c.editar(t4.id, { tarefa_pai_id: null, numero: 1 });
            assert.deepEqual(await numeros(c, ids), ['2', '3', '4', '1']);

            await c.editar(t4.id, { tarefa_pai_id: null, numero: 3 });
            assert.deepEqual(await numeros(c, ids), ['1', '2', '4', '3']);

            await c.editar(t1.id, { tarefa_pai_id: null, numero: 4 });
            assert.deepEqual(await numeros(c, ids), ['4', '1', '3', '2']);
        });

        it('apagar compacta os números das irmãs, só dentro do mesmo pai', async () => {
            const c = await novoCronograma(tipo);
            const pai = await c.criar({ numero: 1 });
            const outra = await c.criar({ numero: 2 });
            const f1 = await c.criar({ nivel: 2, tarefa_pai_id: pai.id, numero: 1 });
            const f2 = await c.criar({ nivel: 2, tarefa_pai_id: pai.id, numero: 2 });
            const f3 = await c.criar({ nivel: 2, tarefa_pai_id: pai.id, numero: 3 });
            const g = await c.criar({ nivel: 2, tarefa_pai_id: outra.id, numero: 1 });

            await c.apagar(f2.id);
            const h = await c.hierarquia();
            assert.equal(h[f1.id], '1.1');
            assert.equal(h[f3.id], '1.2');
            assert.equal(h[g.id], '2.1');
            assert.equal(h[f2.id], undefined);
        });

        it('mover para outro pai ajusta nível dos descendentes e números dos dois grupos', async () => {
            const c = await novoCronograma(tipo);
            const raiz1 = await c.criar({ numero: 1 });
            const raiz2 = await c.criar({ numero: 2 });
            const filha = await c.criar({ nivel: 2, tarefa_pai_id: raiz1.id, numero: 1 });
            const irma = await c.criar({ nivel: 2, tarefa_pai_id: raiz1.id, numero: 2 });
            const neta = await c.criar({ nivel: 3, tarefa_pai_id: filha.id, numero: 1 });
            const dest = await c.criar({ nivel: 2, tarefa_pai_id: raiz2.id, numero: 1 });

            await c.editar(filha.id, { tarefa_pai_id: dest.id, nivel: 3, numero: 1 });

            const h = await c.hierarquia();
            assert.equal(h[irma.id], '1.1');
            assert.equal(h[dest.id], '2.1');
            assert.equal(h[filha.id], '2.1.1');
            assert.equal(h[neta.id], '2.1.1.1');
            const niveis = await prisma().tarefa.findMany({
                where: { id: { in: [filha.id, neta.id, irma.id] } },
                select: { id: true, nivel: true },
            });
            const nivelDe = (id: number) => niveis.find((n) => n.id === id)!.nivel;
            assert.equal(nivelDe(filha.id), 3);
            assert.equal(nivelDe(neta.id), 4);
            assert.equal(nivelDe(irma.id), 2);
            assert.equal((await c.ler(raiz1.id)).n_filhos_imediatos, 1);
            assert.equal((await c.ler(dest.id)).n_filhos_imediatos, 1);
        });

        it('promover filha a raiz e rebaixar raiz a filha', async () => {
            const c = await novoCronograma(tipo);
            const r1 = await c.criar({ numero: 1 });
            const r2 = await c.criar({ numero: 2 });
            const f = await c.criar({ nivel: 2, tarefa_pai_id: r1.id, numero: 1 });

            await c.editar(f.id, { tarefa_pai_id: null, nivel: 1, numero: 1 });
            assert.deepEqual(await numeros(c, [f.id, r1.id, r2.id]), ['1', '2', '3']);
            assert.equal((await c.ler(r1.id)).n_filhos_imediatos, 0);

            await c.editar(r2.id, { tarefa_pai_id: r1.id, nivel: 2, numero: 1 });
            assert.deepEqual(await numeros(c, [f.id, r1.id, r2.id]), ['1', '2', '2.1']);
        });

        it('nível incompatível com o pai e nível máximo do portfólio são rejeitados', async () => {
            const c = await novoCronograma(tipo);
            const r = await c.criar();
            const res = await c.criar({ nivel: 3, tarefa_pai_id: r.id }, 400);
            assert.match(res.body.message, /Nível \(3\) inválido/);
            await prisma().portfolio.update({ where: { id: c.portfolio_id }, data: { nivel_maximo_tarefa: 2 } });
            const f = await c.criar({ nivel: 2, tarefa_pai_id: r.id });
            const alto = await c.criar({ nivel: 3, tarefa_pai_id: f.id }, 400);
            assert.match(alto.body.message, /maior que o configurado no portfólio \(2\)/);
        });

        it('projeto Registrado só aceita tarefas de nível 1', async () => {
            const c = await novoCronograma(tipo);
            const r = await c.criar();
            await prisma().projeto.update({ where: { id: c.projeto_id }, data: { status: 'Registrado' } });
            const res = await c.criar({ nivel: 2, tarefa_pai_id: r.id }, 400);
            assert.match(res.body.message, /Registrado/);
            await c.criar({ numero: 2 });
        });
    });
}
