import { Prisma, TransferenciaHistoricoAcao } from '@prisma/client';

export type OrigemTrocaResponsavel = 'Workflow' | 'Cronograma';

type ValorAnteriorNovo = { anterior: number | null; novo: number | null };

export interface TrocaResponsavelWorkflowParams {
    transferencia_id: number;
    user_id: number;
    origem: OrigemTrocaResponsavel;
    // Andamento da fase (transferencia_andamento). Também informado quando a troca é numa tarefa.
    transferencia_andamento_id: number;
    // Andamento da tarefa (transferencia_andamento_tarefa), quando a troca é numa tarefa da fase.
    transferencia_andamento_tarefa_id?: number;
    orgao: ValorAnteriorNovo;
    // Apenas fases têm pessoa responsável.
    pessoa?: ValorAnteriorNovo;
}

/**
 * Registra no histórico da transferência a troca de responsável (órgão e/ou pessoa)
 * de uma fase ou tarefa do workflow. Não grava nada se nenhum dos dois mudou.
 *
 * Formato de `dados_extra`:
 * {
 *   origem: 'Workflow' | 'Cronograma',
 *   fase: { id, fase },
 *   tarefa: { id, tarefa_fluxo } | null,
 *   anterior: { orgao: { id, sigla, descricao } | null, pessoa: { id, nome_exibicao } | null },
 *   novo:     { orgao: { id, sigla, descricao } | null, pessoa: { id, nome_exibicao } | null },
 * }
 */
export async function registrarTrocaResponsavelWorkflow(
    prismaTxn: Prisma.TransactionClient,
    params: TrocaResponsavelWorkflowParams
): Promise<void> {
    const mudouOrgao = params.orgao.anterior !== params.orgao.novo;
    const mudouPessoa = !!params.pessoa && params.pessoa.anterior !== params.pessoa.novo;
    if (!mudouOrgao && !mudouPessoa) return;

    const andamento = await prismaTxn.transferenciaAndamento.findUniqueOrThrow({
        where: { id: params.transferencia_andamento_id },
        select: { workflow_fase: { select: { id: true, fase: true } } },
    });

    let tarefa: { id: number; tarefa_fluxo: string } | null = null;
    if (params.transferencia_andamento_tarefa_id != undefined) {
        const andamentoTarefa = await prismaTxn.transferenciaAndamentoTarefa.findUniqueOrThrow({
            where: { id: params.transferencia_andamento_tarefa_id },
            select: { workflow_tarefa: { select: { id: true, tarefa_fluxo: true } } },
        });
        tarefa = andamentoTarefa.workflow_tarefa;
    }

    const orgaoIds = [params.orgao.anterior, params.orgao.novo].filter((v): v is number => v != null);
    const orgaos = orgaoIds.length
        ? await prismaTxn.orgao.findMany({
              where: { id: { in: orgaoIds } },
              select: { id: true, sigla: true, descricao: true },
          })
        : [];

    const pessoaIds = [params.pessoa?.anterior, params.pessoa?.novo].filter((v): v is number => v != null);
    const pessoas = pessoaIds.length
        ? await prismaTxn.pessoa.findMany({
              where: { id: { in: pessoaIds } },
              select: { id: true, nome_exibicao: true },
          })
        : [];

    const orgao = (id: number | null) => orgaos.find((o) => o.id === id) ?? null;
    const pessoa = (id: number | null | undefined) => pessoas.find((p) => p.id === id) ?? null;

    await prismaTxn.transferenciaHistorico.create({
        data: {
            transferencia_id: params.transferencia_id,
            criado_por: params.user_id,
            acao: TransferenciaHistoricoAcao.TrocaResponsavelWorkflow,
            dados_extra: {
                origem: params.origem,
                fase: andamento.workflow_fase,
                tarefa,
                anterior: {
                    orgao: orgao(params.orgao.anterior),
                    pessoa: pessoa(params.pessoa?.anterior),
                },
                novo: {
                    orgao: orgao(params.orgao.novo),
                    pessoa: pessoa(params.pessoa?.novo),
                },
            },
        },
    });
}
