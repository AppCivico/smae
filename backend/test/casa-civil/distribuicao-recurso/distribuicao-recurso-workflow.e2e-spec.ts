import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao } from '../../lib';
import {
    cancelarDistribuicao,
    casaCivil,
    completarTransferencia,
    consolidado,
    criarDistribuicao,
    criarTransferencia,
    distribuicaoInicial,
    montarWorkflowAtivo,
} from '../_helpers';

describe('distribuicao-recurso: tarefas no cronograma do workflow', () => {
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
            'CadastroTransferencia.remover',
            'CadastroDistribuicaoStatus.inserir',
            'AndamentoWorkflow.listar',
        ]);
    });

    const valores = { custeio: 1000, investimento: 500, contrapartida: 100 };

    async function transferenciaPronta() {
        const wf = await montarWorkflowAtivo(s);
        const id = await criarTransferencia(s, { tipo_id: wf.tipoId });
        assertStatus(await completarTransferencia(s, id, valores), 200);
        assertStatus(await cancelarDistribuicao(s, (await distribuicaoInicial(id)).id), 201);
        return { wf, id };
    }

    const tarefaDaFase = (id: number, nome: string) =>
        prisma().tarefa.findFirstOrThrow({
            where: { tarefa: nome, removido_em: null, tarefa_cronograma: { transferencia_id: id, removido_em: null } },
            include: { dependencias: true },
        });

    const filhas = (paiId: number) =>
        prisma().tarefa.findMany({
            where: { tarefa_pai_id: paiId, removido_em: null },
            include: { dependencias: true },
            orderBy: { numero: 'asc' },
        });

    const fase = (path: string, transferencia_id: number, faseId: number) =>
        casaCivil(s).post(`/api/workflow-andamento-fase/${path}`).send({ transferencia_id, fase_id: faseId });

    it('distribuição vira tarefa filha da fase de outro órgão e herda as dependências do pai', async () => {
        const { wf, id } = await transferenciaPronta();
        const orgao = await criarOrgao();
        const antes = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
        assert.equal(antes.n_filhos_imediatos, 0);
        assert.equal(antes.dependencias.length, 1);

        const criada = await criarDistribuicao(s, id, { custeio: 300, investimento: 0, contrapartida: 0 }, { orgao_gestor_id: orgao.id });
        assertStatus(criada, 201);

        const pai = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
        assert.equal(pai.n_filhos_imediatos, 1);
        assert.equal(pai.dependencias.length, 0, 'dependências do pai migram para o primeiro filho');
        const [filha] = await filhas(pai.id);
        assert.equal(filha.nivel, 3);
        assert.equal(filha.distribuicao_recurso_id, criada.body.id);
        assert.equal(filha.orgao_id, orgao.id);
        assert.deepEqual(
            filha.dependencias.map((d) => d.dependencia_tarefa_id),
            antes.dependencias.map((d) => d.dependencia_tarefa_id)
        );

        const acompanhamentoSeguinte = await tarefaDaFase(id, `Acompanhamento da etapa ${wf.etapaB.nome}`);
        assert.deepEqual(
            acompanhamentoSeguinte.dependencias.map((d) => d.dependencia_tarefa_id),
            [filha.id],
            'a etapa seguinte passa a depender da filha'
        );
    });

    it('segunda distribuição vira outra filha da mesma fase', async () => {
        const { wf, id } = await transferenciaPronta();
        const a = await criarDistribuicao(s, id, { custeio: 300, investimento: 0, contrapartida: 0 });
        const b = await criarDistribuicao(s, id, { custeio: 200, investimento: 0, contrapartida: 0 });
        assertStatus(a, 201);
        assertStatus(b, 201);

        const pai = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
        const filhasVivas = await filhas(pai.id);
        assert.equal(pai.n_filhos_imediatos, 2);
        assert.deepEqual(
            filhasVivas.map((f) => f.distribuicao_recurso_id).sort(),
            [a.body.id, b.body.id].sort()
        );
        assert.deepEqual(
            filhasVivas.map((f) => f.numero),
            [1, 2]
        );
    });

    it('iniciar a fase de outro órgão marca as filhas como atuais e o consolidado mostra o órgão gestor', async () => {
        const { wf, id } = await transferenciaPronta();
        const orgao = await criarOrgao();
        const criada = await criarDistribuicao(s, id, { custeio: 300, investimento: 0, contrapartida: 0 }, { orgao_gestor_id: orgao.id });
        assertStatus(criada, 201);

        assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
        assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);

        const pai = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
        const [filha] = await filhas(pai.id);
        assert.equal(pai.fase_atual_workflow, true);
        assert.equal(filha.fase_atual_workflow, true);
        const consol = await consolidado(id);
        assert.ok(consol.length >= 1);
        assert.ok(
            consol.some((c) => c.orgaos_envolvidos.includes(orgao.id)),
            JSON.stringify(consol)
        );

        assertStatus(await fase('finalizar', id, wf.faseOutroOrgao.id), 201);
        assert.equal((await filhas(pai.id))[0].fase_atual_workflow, false, 'finalizar fase desmarca as filhas');
    });

    it(
        'remover a única distribuição devolve ao pai as dependências e não deixa ninguém dependendo de tarefa removida',
        {
            todo: 'BUG: DistribuicaoRecursoService.remove apenas marca a tarefa filha como removida; a fase seguinte continua dependendo dela e o pai perde as dependências (distribuicao-recurso.service.ts:1904)',
        },
        async () => {
            const { wf, id } = await transferenciaPronta();
            const criada = await criarDistribuicao(s, id, { custeio: 300, investimento: 0, contrapartida: 0 });
            assertStatus(criada, 201);
            assertStatus(await casaCivil(s).delete(`/api/distribuicao-recurso/${criada.body.id}`), 202);

            const pendurados = await prisma().$queryRaw<{ n: bigint }[]>`
                select count(*) n from tarefa_dependente td
                join tarefa t on t.id = td.tarefa_id and t.removido_em is null
                join tarefa_cronograma tc on tc.id = t.tarefa_cronograma_id and tc.transferencia_id = ${id}::int
                join tarefa d on d.id = td.dependencia_tarefa_id and d.removido_em is not null`;
            assert.equal(Number(pendurados[0].n), 0);
            const pai = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
            assert.equal(pai.dependencias.length, 1);
        }
    );
});
