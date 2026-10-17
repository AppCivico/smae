import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, prisma } from '../lib';
import { periodo, Tipo } from './_helpers';
import { Cronograma, novoCronograma, ymd } from './_cronograma';

const dep = (dependencia_tarefa_id: number, tipo: string, latencia = 0) => ({ dependencia_tarefa_id, tipo, latencia });

async function clonar(c: Cronograma, fonte: Cronograma, esperado = 201) {
    const res = await api(c.sessao).post(`${c.base}/clone-tarefas`).send({ projeto_fonte_id: fonte.projeto_id });
    assertStatus(res, esperado);
    return res.body;
}

// fonte: 2 raízes, R1 com filhas F1 (marco) e F2 -> F1, R2 sem filhas
async function montarFonte(c: Cronograma) {
    const r1 = await c.criar({ tarefa: 'Raiz 1', descricao: 'desc r1', recursos: 'rec r1' });
    const r2 = await c.criar({ tarefa: 'Raiz 2', numero: 2, ...periodo('2032-01-01', 7) });
    const f1 = await c.criar({
        tarefa: 'Filha 1',
        nivel: 2,
        tarefa_pai_id: r1.id,
        ...periodo('2032-02-01', 10),
        eh_marco: true,
    });
    const f2 = await c.criar({
        tarefa: 'Filha 2',
        nivel: 2,
        numero: 2,
        tarefa_pai_id: r1.id,
        duracao_planejado: 4,
        dependencias: [dep(f1.id, 'termina_pro_inicio', 1)],
    });
    return { r1, r2, f1, f2 };
}

for (const tipo of ['PP', 'MDO'] as Tipo[]) {
    describe(`clone de tarefas (${tipo})`, () => {
        before(async () => {
            await bootApp();
        });

        it('copia hierarquia, numeração, dependências e duração, sem copiar datas nem realizado', async () => {
            const fonte = await novoCronograma(tipo);
            const f = await montarFonte(fonte);
            await fonte.editar(f.f1.id, { ...periodo('2032-02-01', 10), percentual_concluido: 50, inicio_real: '2032-02-01', termino_real: '2032-02-10', duracao_real: 10 });

            const alvo = await fonte.novoProjeto();
            await clonar(alvo, fonte);

            const linhas = await alvo.lista();
            assert.equal(linhas.length, 4);
            const porNome = Object.fromEntries(linhas.map((l: any) => [l.tarefa, l]));
            assert.deepEqual(Object.keys(porNome).sort(), ['Filha 1', 'Filha 2', 'Raiz 1', 'Raiz 2']);
            const raiz1 = await alvo.ler(porNome['Raiz 1'].id);
            assert.equal(raiz1.descricao, 'desc r1');
            assert.equal(raiz1.recursos, 'rec r1');
            assert.equal(porNome['Raiz 1'].n_filhos_imediatos, 2);
            assert.equal(porNome['Filha 1'].tarefa_pai_id, porNome['Raiz 1'].id);
            assert.equal(porNome['Filha 2'].tarefa_pai_id, porNome['Raiz 1'].id);
            assert.equal(porNome['Filha 1'].nivel, 2);
            assert.equal(porNome['Filha 1'].eh_marco, true);
            assert.equal(porNome['Filha 1'].duracao_planejado, 10);
            assert.equal(porNome['Raiz 2'].duracao_planejado, 7);

            const h = await alvo.hierarquia();
            assert.equal(h[porNome['Raiz 1'].id], '1');
            assert.equal(h[porNome['Filha 2'].id], '1.2');
            assert.equal(h[porNome['Raiz 2'].id], '2');

            const f2 = await alvo.ler(porNome['Filha 2'].id);
            assert.deepEqual(f2.dependencias, [
                { dependencia_tarefa_id: porNome['Filha 1'].id, tipo: 'termina_pro_inicio', latencia: 1 },
            ]);
            assert.equal(f2.n_dep_inicio_planejado, 1);
            assert.equal(porNome['Filha 1'].percentual_concluido ?? 0, 0);
            assert.equal(porNome['Filha 1'].inicio_real, null);

            const origem = await prisma().tarefa.count({
                where: { tarefa_cronograma: { projeto_id: fonte.projeto_id }, removido_em: null },
            });
            assert.equal(origem, 4);
            assert.equal((await fonte.ler(f.f1.id)).percentual_concluido, 50);
        });

        it('clonar de novo substitui as tarefas do destino em vez de duplicar', async () => {
            const fonte = await novoCronograma(tipo);
            await montarFonte(fonte);
            const alvo = await fonte.novoProjeto();
            await alvo.criar({ tarefa: 'Tarefa antiga do destino' });

            await clonar(alvo, fonte);
            const primeira = (await alvo.lista()).map((l: any) => l.id);
            await clonar(alvo, fonte);
            const segunda = await alvo.lista();

            assert.equal(segunda.length, 4);
            assert.ok(!segunda.some((l: any) => l.tarefa === 'Tarefa antiga do destino'));
            assert.ok(segunda.every((l: any) => !primeira.includes(l.id)));
            const h = await alvo.hierarquia();
            assert.deepEqual(Object.values(h).sort(), ['1', '1.1', '1.2', '2']);
        });

        it('destino Registrado só recebe o nível 1, sem filhos', async () => {
            const fonte = await novoCronograma(tipo);
            await montarFonte(fonte);
            const alvo = await fonte.novoProjeto();
            await prisma().projeto.update({ where: { id: alvo.projeto_id }, data: { status: 'Registrado' } });

            await clonar(alvo, fonte);
            const linhas = await alvo.lista();
            assert.deepEqual(linhas.map((l: any) => l.tarefa).sort(), ['Raiz 1', 'Raiz 2']);
            assert.ok(linhas.every((l: any) => l.nivel === 1 && l.n_filhos_imediatos === 0));
        });

        it('recusa clonar de origem já validada ou em acompanhamento', async () => {
            const fonte = await novoCronograma(tipo);
            await montarFonte(fonte);
            const alvo = await fonte.novoProjeto();
            for (const status of ['Validado', 'EmAcompanhamento', 'Suspenso', 'Fechado'] as const) {
                await prisma().projeto.update({ where: { id: fonte.projeto_id }, data: { status } });
                const res = await api(alvo.sessao).post(`${alvo.base}/clone-tarefas`).send({ projeto_fonte_id: fonte.projeto_id });
                assertStatus(res, 400);
                assert.match(res.body.message, new RegExp(`status ${status}`));
            }
            assert.equal((await alvo.lista()).length, 0);
        });

        it('clone alimenta o cronograma do destino, que vira independente da origem', async () => {
            const fonte = await novoCronograma(tipo);
            const f = await montarFonte(fonte);
            const alvo = await fonte.novoProjeto();
            await clonar(alvo, fonte);
            const linhas = await alvo.lista();
            const r2 = linhas.find((l: any) => l.tarefa === 'Raiz 2');

            await alvo.editar(r2.id, periodo('2040-01-01', 3));
            const cr = await alvo.cronograma();
            assert.equal(ymd(cr.previsao_inicio), '2040-01-01');
            assert.equal(cr.previsao_termino, null);

            const f1 = linhas.find((l: any) => l.tarefa === 'Filha 1');
            const f2 = linhas.find((l: any) => l.tarefa === 'Filha 2');
            await alvo.editar(f1.id, periodo('2040-02-01', 10));
            const f2Depois = await alvo.ler(f2.id);
            assert.equal(f2Depois.inicio_planejado, '2040-02-11');
            assert.equal(f2Depois.termino_planejado, '2040-02-14');
            const raiz1 = await alvo.linha(linhas.find((l: any) => l.tarefa === 'Raiz 1').id);
            assert.equal(raiz1.inicio_planejado.slice(0, 10), '2040-02-01');
            assert.equal(raiz1.termino_planejado.slice(0, 10), '2040-02-14');
            assert.equal(ymd((await alvo.cronograma()).previsao_termino), '2040-02-14');

            const crFonte = await fonte.cronograma();
            assert.equal(ymd(crFonte.previsao_inicio), '2032-01-01');
            assert.equal((await fonte.ler(f.r2.id)).inicio_planejado, '2032-01-01');
        });
    });
}
