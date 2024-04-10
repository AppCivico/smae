import { HttpException, Injectable } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma, WorkflowResponsabilidade } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateWorkflowAndamentoTarefasDto } from './dto/update-workflow-andamento-tarefa.dto';

@Injectable()
export class WorkflowAndamentoTarefasService {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(dto: UpdateWorkflowAndamentoTarefasDto, user: PessoaFromJwt): Promise<RecordWithId[]> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId[]> => {
                // Encontrando row na table transferencia_andamento
                const transferenciaAndamento = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        workflow_fase_id: dto.fase_id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        orgao_responsavel_id: true,
                        pessoa_responsavel_id: true,

                        transferencia: {
                            select: {
                                workflow_id: true,
                            },
                        },
                    },
                });
                if (!transferenciaAndamento)
                    throw new Error('Não foi encontrada um registro de andamento para esta fase');

                if (!transferenciaAndamento.transferencia.workflow_id)
                    throw new Error('Transferência não possui configuração de Workflow.');

                const operations = [];
                const idsAtualizados: RecordWithId[] = [];
                for (const tarefa of dto.tarefas) {
                    // Verificando se esta tarefa está de fato na configuração do Workflow.
                    const tarefaWorkfloConfig = await prismaTxn.fluxoTarefa.findFirst({
                        where: {
                            removido_em: null,
                            workflow_tarefa_id: tarefa.id,

                            fluxo_fase: {
                                id: dto.fase_id,
                                fluxo: {
                                    workflow_id: transferenciaAndamento.transferencia.workflow_id,
                                },
                            },
                        },
                        select: {
                            responsabilidade: true,
                        },
                    });
                    if (!tarefaWorkfloConfig) throw new Error('Tarefa não existe na configuração do Workflow.');

                    // Verificando necessidade de preencher órgão responsável.
                    if (
                        tarefaWorkfloConfig.responsabilidade == WorkflowResponsabilidade.Propria &&
                        tarefa.orgao_responsavel_id != undefined
                    )
                        throw new HttpException(
                            `orgao_responsavel_id| Órgão não deve ser enviado para tarefa ${tarefa.id}, pois é de responsabilidade própria.`,
                            400
                        );

                    const transferenciaAndamentoTarefaRow = await prismaTxn.transferenciaAndamentoTarefa.findFirst({
                        where: {
                            transferencia_andamento_id: transferenciaAndamento.id,
                            workflow_tarefa_fluxo_id: tarefa.id,
                            removido_em: null,
                        },
                        select: {
                            id: true,
                            orgao_responsavel_id: true,
                            feito: true,
                        },
                    });
                    if (!transferenciaAndamentoTarefaRow)
                        throw new Error(
                            'Não foi encontrado registro de andamento para a tarefa. Fase anterior não foi fechada ou está em fase Terminal.'
                        );

                    if (
                        tarefaWorkfloConfig.responsabilidade == WorkflowResponsabilidade.OutroOrgao &&
                        (!tarefa.orgao_responsavel_id || !transferenciaAndamentoTarefaRow.orgao_responsavel_id)
                    )
                        throw new HttpException(
                            `orgao_responsavel_id| Órgão deve ser enviado para tarefa ${tarefa.id}, pois é de responsabilidade de outro órgão.`,
                            400
                        );

                    if (
                        transferenciaAndamentoTarefaRow.feito != tarefa.concluida ||
                        transferenciaAndamentoTarefaRow.orgao_responsavel_id != tarefa.orgao_responsavel_id
                    ) {
                        operations.push(
                            prismaTxn.transferenciaAndamentoTarefa.update({
                                where: {
                                    id: transferenciaAndamentoTarefaRow.id,
                                },
                                data: {
                                    feito: tarefa.concluida,
                                    orgao_responsavel_id: tarefa.orgao_responsavel_id,
                                    atualizado_por: user.id,
                                    atualizado_em: new Date(Date.now()),
                                },
                            })
                        );

                        idsAtualizados.push({ id: transferenciaAndamentoTarefaRow.id });
                    }
                }

                await Promise.all(operations);

                return idsAtualizados;
            }
        );

        return updated;
    }
}
