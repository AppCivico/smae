import { before, describe, it } from 'node:test';
import { assert, bootApp, prisma } from '../lib';
import { periodo, periodoReal, Tipo } from './_helpers';
import { novoCronograma, ymd } from './_cronograma';

const dep = (dependencia_tarefa_id: number, tipo: string, latencia = 0) => ({ dependencia_tarefa_id, tipo, latencia });
const dia = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : null);
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

for (const tipo of ['PP', 'MDO'] as Tipo[]) {
    describe(`tarefa atraso e projeção (${tipo})`, () => {
        before(async () => {
            await bootApp();
        });

        it('cronograma no futuro e sem realizado fica Em dia, com projeção a partir de hoje', async () => {
            const c = await novoCronograma(tipo);
            const t = await c.criar(periodo('2090-01-01', 10));
            const linha = await c.linha(t.id);
            assert.equal(linha.atraso, null);
            assert.equal(diasEntre(dia(linha.projecao_inicio)!, dia(linha.projecao_termino)!), 9);

            const cr = await c.cronograma();
            assert.equal(cr.status_cronograma, 'Em dia');
            assert.equal(cr.em_atraso, false);
            assert.equal(cr.atraso, null);
            assert.equal(ymd(cr.projecao_termino), dia(linha.projecao_termino));
        });

        it('tarefa vencida e não concluída atrasa o cronograma; concluir normaliza o status', async () => {
            const c = await novoCronograma(tipo);
            const t = await c.criar(periodo('2020-01-01', 10));
            const linha = await c.linha(t.id);
            assert.ok(linha.atraso > 0);

            const hoje = dia(linha.projecao_inicio)!;
            const projTermino = dia(linha.projecao_termino)!;
            assert.equal(diasEntre(hoje, projTermino), 9);

            let cr = await c.cronograma();
            const atrasoEsperado = diasEntre('2020-01-10', projTermino);
            // o fuso do sistema faz o ceil() de dias variar em 1
            assert.ok(cr.atraso === atrasoEsperado || cr.atraso === atrasoEsperado + 1, `atraso ${cr.atraso}`);
            assert.equal(cr.status_cronograma, 'Atrasado');
            assert.equal(cr.em_atraso, true);
            assert.equal(cr.percentual_atraso, Math.round((cr.atraso / cr.previsao_duracao) * 100));

            await c.editar(t.id, { ...periodoReal('2020-01-01', 10), percentual_concluido: 100 });
            const depois = await c.linha(t.id);
            assert.ok(!depois.atraso);
            cr = await c.cronograma();
            assert.equal(cr.status_cronograma, 'Concluído');
            assert.equal(cr.em_atraso, false);
            assert.equal(cr.atraso, null);
            assert.equal(ymd(cr.projecao_termino), '2020-01-10');
            assert.equal(cr.percentual_concluido, 100);
        });

        it('projeção da sucessora acompanha a predecessora atrasada e respeita a latência', async () => {
            const c = await novoCronograma(tipo);
            const pred = await c.criar(periodo('2020-02-01', 5));
            const suc = await c.criar({
                numero: 2,
                duracao_planejado: 3,
                dependencias: [dep(pred.id, 'termina_pro_inicio', 2)],
            });
            const lp = await c.linha(pred.id);
            const ls = await c.linha(suc.id);
            assert.equal(dia(ls.projecao_inicio), dia(
                new Date(Date.parse(dia(lp.projecao_termino)!) + 2 * 86400000).toISOString()
            ));
            assert.equal(diasEntre(dia(ls.projecao_inicio)!, dia(ls.projecao_termino)!), 2);

            await c.editar(pred.id, { ...periodoReal('2020-02-01', 5), percentual_concluido: 100 });
            const depois = await c.linha(suc.id);
            assert.equal(dia(depois.projecao_inicio) !== dia(ls.projecao_inicio), true);
        });

        it('pai atrasado herda o atraso das filhas e conta no cronograma', async () => {
            const c = await novoCronograma(tipo);
            const pai = await c.criar();
            const f = await c.criar({ nivel: 2, tarefa_pai_id: pai.id, ...periodo('2020-03-01', 4) });
            const linhas = await c.lista();
            const lp = linhas.find((l: any) => l.id === pai.id);
            const lf = linhas.find((l: any) => l.id === f.id);
            assert.ok(lf.atraso > 0);
            assert.ok(lp.atraso > 0);
            assert.equal(dia(lp.projecao_termino), dia(lf.projecao_termino));
            assert.equal((await c.cronograma()).status_cronograma, 'Atrasado');
        });

        it('acompanhamento com cronograma paralisado marca o cronograma como Paralisado', async () => {
            const c = await novoCronograma(tipo);
            await c.criar(periodo('2020-04-01', 4));
            await prisma().projetoAcompanhamento.create({
                data: {
                    projeto_id: c.projeto_id,
                    ordem: 1,
                    data_registro: new Date('2026-01-01'),
                    participantes: 'e2e',
                    cronograma_paralisado: true,
                    criado_em: new Date(),
                    criado_por: c.sessao.pessoa.id,
                },
            });
            await c.lista();
            assert.equal((await c.cronograma()).status_cronograma, 'Paralisado');
        });

        it('tolerância de atraso do cronograma define quando em_atraso liga', async () => {
            const c = await novoCronograma(tipo);
            await c.criar(periodo('2020-05-01', 10));
            const cr0 = await c.cronograma();
            await prisma().tarefaCronograma.update({ where: { id: cr0.id }, data: { tolerancia_atraso: 100000 } });
            await c.lista();
            const cr = await c.cronograma();
            assert.ok(cr.atraso! > 0);
            assert.equal(cr.em_atraso, false);
            assert.notEqual(cr.status_cronograma, 'Atrasado');
        });
    });
}
