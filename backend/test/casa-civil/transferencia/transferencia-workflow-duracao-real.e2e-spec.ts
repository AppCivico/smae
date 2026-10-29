import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, prisma, Sessao } from '../../lib';
import { novoCronograma } from '../../pp/_cronograma';
import {
    buscarStatusBase,
    cancelarDistribuicao,
    casaCivil,
    completarTransferencia,
    criarDistribuicao,
    criarTransferencia,
    distribuicaoInicial,
    montarWorkflowAtivo,
    registrarStatus,
} from '../_helpers';

const DIA = 86_400_000;

const duracaoEsperada = (t: { inicio_real: Date | null; termino_real: Date | null }) =>
    t.inicio_real && t.termino_real && t.termino_real >= t.inicio_real
        ? Math.round((t.termino_real.getTime() - t.inicio_real.getTime()) / DIA) + 1
        : null;

const diasAtras = (n: number) => {
    const hoje = new Date(Date.now());
    return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - n));
};

describe('transferencia: duracao_real das tarefas espelhadas pelo workflow', () => {
    let s: Sessao;

    before(async () => {
        await bootApp();
        s = await criarPessoaComPrivilegios([
            'CadastroWorkflows.inserir',
            'CadastroWorkflows.editar',
            'CadastroWorkflows.listar',
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroCronogramaTransferencia.listar',
            'CadastroDistribuicaoStatus.inserir',
            'AndamentoWorkflow.listar',
        ]);
    });

    const fase = (path: string, transferencia_id: number, fase_id?: number) =>
        casaCivil(s)
            .post(`/api/workflow-andamento-fase/${path}`)
            .send(fase_id === undefined ? { transferencia_id } : { transferencia_id, fase_id });

    const tarefas = (id: number) =>
        prisma().tarefa.findMany({
            where: { removido_em: null, tarefa_cronograma: { transferencia_id: id, removido_em: null } },
        });

    const tarefaDaFase = (id: number, nome: string) =>
        prisma().tarefa.findFirstOrThrow({
            where: { tarefa: nome, removido_em: null, tarefa_cronograma: { transferencia_id: id, removido_em: null } },
        });

    const tarefaNivel3 = (id: number) =>
        prisma().tarefa.findFirstOrThrow({
            where: { nivel: 3, removido_em: null, tarefa_cronograma: { transferencia_id: id, removido_em: null } },
        });

    async function assertCronogramaCoerente(id: number) {
        for (const t of await tarefas(id)) {
            assert.equal(t.duracao_real, duracaoEsperada(t), `tarefa ${t.id} "${t.tarefa}" (nível ${t.nivel})`);
        }
    }

    async function nova(comTarefa = false) {
        const wf = await montarWorkflowAtivo(s, { comTarefa });
        const id = await criarTransferencia(s, { tipo_id: wf.tipoId });
        return { wf, id };
    }

    describe('movimentação do workflow', () => {
        it('iniciar o workflow só grava inicio_real: duracao_real continua nula', async () => {
            const { wf, id } = await nova(true);
            const espelho = await tarefaDaFase(id, wf.fasePropria.nome);
            assert.ok(espelho.inicio_real);
            assert.equal(espelho.termino_real, null);
            assert.equal(espelho.duracao_real, null);
            const filha = await tarefaNivel3(id);
            assert.ok(filha.inicio_real);
            assert.equal(filha.duracao_real, null);
            await assertCronogramaCoerente(id);
        });

        it('finalizar fase sem tarefas no mesmo dia grava duracao_real = 1', async () => {
            const { wf, id } = await nova();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            const espelho = await tarefaDaFase(id, wf.fasePropria.nome);
            assert.ok(espelho.inicio_real && espelho.termino_real);
            assert.equal(espelho.duracao_real, 1);
            await assertCronogramaCoerente(id);
        });

        it('finalizar fase iniciada há 3 dias grava duracao_real = 4', async () => {
            const { wf, id } = await nova();
            const espelho = await tarefaDaFase(id, wf.fasePropria.nome);
            await prisma().tarefa.update({ where: { id: espelho.id }, data: { inicio_real: diasAtras(3) } });

            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            const depois = await tarefaDaFase(id, wf.fasePropria.nome);
            assert.equal(depois.duracao_real, duracaoEsperada(depois));
            assert.equal(depois.duracao_real, 4);
        });

        it('iniciar fase grava só inicio_real: duracao_real nula', async () => {
            const { wf, id } = await nova();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);
            const espelho = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
            assert.ok(espelho.inicio_real);
            assert.equal(espelho.termino_real, null);
            assert.equal(espelho.duracao_real, null);
            await assertCronogramaCoerente(id);
        });

        it('concluir tarefa do workflow grava duracao_real e desfazer volta para nula', async () => {
            const { wf, id } = await nova(true);
            const filha = await tarefaNivel3(id);
            await prisma().tarefa.update({ where: { id: filha.id }, data: { inicio_real: diasAtras(2) } });

            const marcar = (concluida: boolean) =>
                casaCivil(s)
                    .patch('/api/workflow-andamento-fase')
                    .send({
                        transferencia_id: id,
                        fase_id: wf.fasePropria.id,
                        tarefas: [{ id: wf.tarefaOutroOrgao.id, orgao_responsavel_id: 1, concluida }],
                    });

            assertStatus(await marcar(true), 200);
            const feita = await prisma().tarefa.findUniqueOrThrow({ where: { id: filha.id } });
            assert.ok(feita.termino_real);
            assert.equal(feita.duracao_real, duracaoEsperada(feita));
            assert.equal(feita.duracao_real, 3);
            await assertCronogramaCoerente(id);

            assertStatus(await marcar(false), 200);
            const desfeita = await prisma().tarefa.findUniqueOrThrow({ where: { id: filha.id } });
            assert.equal(desfeita.termino_real, null);
            assert.equal(desfeita.duracao_real, null);
            await assertCronogramaCoerente(id);
        });

        it('reabrir fase anterior volta duracao_real para nula', async () => {
            const { wf, id } = await nova();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);
            assert.equal((await tarefaDaFase(id, wf.fasePropria.nome)).duracao_real, 1);

            assertStatus(await fase('reabrir-fase-anterior', id), 201);
            const reaberta = await tarefaDaFase(id, wf.fasePropria.nome);
            assert.equal(reaberta.termino_real, null);
            assert.equal(reaberta.duracao_real, null);
            const desfeita = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
            assert.equal(desfeita.duracao_real, null);
            await assertCronogramaCoerente(id);
        });

        it('avançar etapa encerra as tarefas da etapa anterior com duracao_real', async () => {
            const { wf, id } = await nova();
            const etapaA = await tarefaDaFase(id, wf.etapaA.nome);
            const filhasA = await prisma().tarefa.findMany({ where: { tarefa_pai_id: etapaA.id, removido_em: null } });
            await prisma().tarefa.updateMany({
                where: { id: { in: filhasA.map((f) => f.id) } },
                data: { inicio_real: diasAtras(5) },
            });

            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);
            assertStatus(await fase('finalizar', id, wf.faseOutroOrgao.id), 201);

            const depois = await prisma().tarefa.findMany({
                where: { OR: [{ id: etapaA.id }, { tarefa_pai_id: etapaA.id }], removido_em: null },
            });
            for (const t of depois) {
                assert.ok(t.termino_real, `tarefa "${t.tarefa}" encerrada`);
                assert.equal(t.duracao_real, duracaoEsperada(t), `tarefa "${t.tarefa}" (nível ${t.nivel})`);
                assert.ok(t.duracao_real! >= 1);
            }

            assert.equal((await tarefaDaFase(id, wf.faseB.nome)).duracao_real, null, 'fase B só iniciou');
            await assertCronogramaCoerente(id);
        });

        it('concluir a distribuição de recurso grava duracao_real na tarefa filha', async () => {
            const { wf, id } = await nova();
            assertStatus(
                await completarTransferencia(s, id, { custeio: 1000, investimento: 500, contrapartida: 100 }),
                200
            );
            assertStatus(await cancelarDistribuicao(s, (await distribuicaoInicial(id)).id), 201);
            const criada = await criarDistribuicao(s, id, { custeio: 300, investimento: 0, contrapartida: 0 });
            assertStatus(criada, 201);

            const pai = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
            const filha = await prisma().tarefa.findFirstOrThrow({
                where: { tarefa_pai_id: pai.id, distribuicao_recurso_id: criada.body.id, removido_em: null },
            });
            await prisma().tarefa.update({ where: { id: filha.id }, data: { inicio_real: diasAtras(1) } });

            const finalizada = await buscarStatusBase('Finalizada');
            assertStatus(await registrarStatus(s, criada.body.id, finalizada.id), 201);

            const depois = await prisma().tarefa.findUniqueOrThrow({ where: { id: filha.id } });
            assert.ok(depois.termino_real);
            assert.equal(depois.duracao_real, 2);
            await assertCronogramaCoerente(id);
        });
    });

    describe('salvar o cronograma com duracao_real nula', () => {
        const patchTarefa = (id: number, tarefaId: number, corpo: Record<string, unknown>) =>
            casaCivil(s).patch(`/api/transferencia-tarefa/${id}/tarefa/${tarefaId}`).send(corpo);

        it('transferência: calcula a duração quando vem nula com as duas datas', async () => {
            const { wf, id } = await nova();
            const espelho = await tarefaDaFase(id, wf.fasePropria.nome);

            const res = await patchTarefa(id, espelho.id, {
                inicio_real: '2026-01-10',
                termino_real: '2026-01-12',
                duracao_real: null,
            });
            assertStatus(res, 200);
            const salva = await prisma().tarefa.findUniqueOrThrow({ where: { id: espelho.id } });
            assert.equal(salva.duracao_real, 3);
        });

        it('transferência: início depois do término continua 400', async () => {
            const { wf, id } = await nova();
            const espelho = await tarefaDaFase(id, wf.fasePropria.nome);

            const res = await patchTarefa(id, espelho.id, {
                inicio_real: '2026-01-12',
                termino_real: '2026-01-10',
                duracao_real: null,
            });
            assertStatus(res, 400);
        });

        it('transferência: salvar depois de finalizar a fase pelo workflow não falha', async () => {
            const { wf, id } = await nova();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            const espelho = await tarefaDaFase(id, wf.fasePropria.nome);
            assert.equal(espelho.duracao_real, 1);
            const ymd = (d: Date) => d.toISOString().slice(0, 10);

            // O front manda duracao_real nula quando só o progresso muda.
            const res = await patchTarefa(id, espelho.id, {
                inicio_real: ymd(espelho.inicio_real!),
                termino_real: ymd(espelho.termino_real!),
                duracao_real: null,
                percentual_concluido: 100,
            });
            assertStatus(res, 200);
            assert.equal((await prisma().tarefa.findUniqueOrThrow({ where: { id: espelho.id } })).duracao_real, 1);
        });

        it('projeto: duracao_real nula com as duas datas continua 400', async () => {
            const crono = await novoCronograma('PP');
            const { id } = await crono.criar();
            const res = await crono.editar(
                id,
                { inicio_real: '2026-01-10', termino_real: '2026-01-12', duracao_real: null },
                400
            );
            assert.match(res.message, /Se a duração real é nula/);
        });
    });
});
