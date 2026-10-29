import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../../lib';
import { casaCivil, criarTransferencia, montarWorkflowAtivo } from '../_helpers';

// Este arquivo depende de a primeira transferência rodar num banco virgem (ids de fluxo_fase e de transferencia_andamento coincidem).
describe('transferencia: workflow com tarefas configuradas na fase', () => {
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
            'AndamentoWorkflow.listar',
        ]);
    });

    const novaTransferencia = (tipoId: number) =>
        casaCivil(s)
            .post('/api/transferencia')
            .send({ tipo_id: tipoId, orgao_concedente_id: 1, esfera: 'Estadual', objeto: uniq('obj'), ano: 2026 });

    it('criar transferência de um workflow com fluxo-tarefa configurado', async () => {
        const wf = await montarWorkflowAtivo(s, { comTarefa: true });
        assertStatus(await novaTransferencia(wf.tipoId), 201);
    });

    it('tarefa do fluxo-tarefa vira tarefa de nível 3 sob a fase certa, mesmo com ids divergentes', async () => {
        const plano = await montarWorkflowAtivo(s);
        await criarTransferencia(s, { tipo_id: plano.tipoId });
        await criarTransferencia(s, { tipo_id: plano.tipoId });

        const wf = await montarWorkflowAtivo(s, { comTarefa: true });
        const res = await novaTransferencia(wf.tipoId);
        assertStatus(res, 201);

        const nivel3 = await prisma().tarefa.findMany({
            where: { nivel: 3, removido_em: null, tarefa_cronograma: { transferencia_id: res.body.id } },
            include: { tarefa_pai: true },
        });
        assert.equal(nivel3.length, 1, 'uma tarefa de acompanhamento para a tarefa configurada');
        assert.equal(nivel3[0].tarefa_pai?.tarefa, wf.fasePropria.nome);
    });
});
