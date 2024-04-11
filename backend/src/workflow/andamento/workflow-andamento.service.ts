import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkflowService } from 'src/workflow/configuracao/workflow.service';
import { FilterWorkflowAndamentoDto } from './dto/filter-andamento.dto';
import { AndamentoFaseDto, AndamentoTarefaDto, WorkflowAndamentoDto } from './entities/workflow-andamento.entity';
import { WorkflowResponsabilidade, WorkflowSituacaoTipo } from '@prisma/client';

@Injectable()
export class WorkflowAndamentoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async findAndamento(filter: FilterWorkflowAndamentoDto, user: PessoaFromJwt): Promise<WorkflowAndamentoDto> {
        if (!filter.transferencia_id)
            throw new HttpException('transferencia_id| É obrigatório para uso deste endpoint.', 400);

        const transferencia = await this.prisma.transferencia.findFirst({
            where: {
                id: filter.transferencia_id,
                removido_em: null,
            },
            select: {
                id: true,
                workflow_id: true,
                andamentoWorkflow: {
                    where: {
                        removido_em: null,
                        data_termino: null,
                        data_inicio: { not: undefined },
                    },
                    select: {
                        id: true,
                        workflow_etapa_id: true,
                    },
                },
            },
        });
        if (!transferencia || !transferencia.workflow_id) throw new Error('Transferência inválida ou não configurada');

        if (transferencia.andamentoWorkflow.length > 1)
            throw new Error('Erro interno ao definir etapa relevante para acompanhamento');

        const workflow = await this.workflowService.findOne(transferencia.workflow_id, user);

        return {
            ...workflow,
            possui_proxima_etapa: true,
            pode_passar_para_proxima_etapa: true,

            fluxo: await Promise.all(
                workflow.fluxo
                    .filter((e) => e.workflow_etapa_de!.id == transferencia.andamentoWorkflow[0].workflow_etapa_id)
                    .map(async (fluxo) => {
                        return {
                            ...fluxo,

                            fases: await Promise.all(
                                fluxo.fases.map(async (fase) => {
                                    return {
                                        ...fase,
                                        andamento: await this.getAndamentoFaseRet(
                                            transferencia.id,
                                            fase.id!,
                                            transferencia.workflow_id!
                                        ),

                                        tarefas: await Promise.all(
                                            fase.tarefas.map(async (tarefa) => {
                                                return {
                                                    ...tarefa,

                                                    andamento: await this.getAndamentoTarefaRet(
                                                        transferencia.id,
                                                        tarefa.workflow_tarefa!.id,
                                                        transferencia.workflow_id!
                                                    ),
                                                };
                                            })
                                        ),
                                    };
                                })
                            ),
                        };
                    })
            ),
        };
    }

    private async getAndamentoFaseRet(
        transferencia_id: number,
        fase_id: number,
        workflow_id: number
    ): Promise<AndamentoFaseDto | null> {
        const row = await this.prisma.transferenciaAndamento.findFirst({
            where: {
                removido_em: null,
                transferencia_id: transferencia_id,
                workflow_fase_id: fase_id,
            },
            select: {
                data_inicio: true,
                data_termino: true,

                workflow_situacao: {
                    select: {
                        id: true,
                        situacao: true,
                        tipo_situacao: true,
                    },
                },

                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },

                pessoa_responsavel: {
                    select: {
                        id: true,
                        nome_exibicao: true,
                    },
                },

                tarefas: {
                    where: { feito: false },
                    select: { id: true },
                },

                workflow_fase: {
                    select: {
                        fluxos: {
                            take: 1,
                            where: {
                                fluxo: {
                                    workflow_id: workflow_id,
                                },
                            },
                            select: {
                                responsabilidade: true,
                            },
                        },
                    },
                },
            },
        });

        if (!row) return null;

        // Regras que definem se fase pode ser concluída:
        // 1. Todas tarefas concluídas.
        // 2. Fase sem tarefas.
        // 3. Situação é: suspensa, cancelada ou terminal.
        let pode_concluir: boolean;

        if (
            row.tarefas.length == 0 ||
            row.workflow_situacao.tipo_situacao == WorkflowSituacaoTipo.Cancelado ||
            row.workflow_situacao.tipo_situacao == WorkflowSituacaoTipo.Suspenso ||
            row.workflow_situacao.tipo_situacao == WorkflowSituacaoTipo.Terminal
        ) {
            pode_concluir = true;
        } else {
            pode_concluir = false;
        }

        return {
            data_inicio: row.data_inicio,
            data_termino: row.data_termino,
            concluida: row.data_termino ? true : false,
            pode_concluir: pode_concluir,

            necessita_preencher_orgao:
                !row.orgao_responsavel &&
                row.workflow_fase.fluxos[0].responsabilidade == WorkflowResponsabilidade.OutroOrgao
                    ? true
                    : false,

            necessita_preencher_pessoa:
                !row.pessoa_responsavel &&
                row.workflow_fase.fluxos[0].responsabilidade == WorkflowResponsabilidade.OutroOrgao
                    ? true
                    : false,

            situacao: {
                id: row.workflow_situacao.id,
                situacao: row.workflow_situacao.situacao,
                tipo_situacao: row.workflow_situacao.tipo_situacao,
            },

            orgao_responsavel: row.orgao_responsavel
                ? {
                      id: row.orgao_responsavel.id,
                      sigla: row.orgao_responsavel.sigla,
                      descricao: row.orgao_responsavel.descricao,
                  }
                : null,

            pessoa_responsavel: row.pessoa_responsavel
                ? {
                      id: row.pessoa_responsavel.id,
                      nome_exibicao: row.pessoa_responsavel.nome_exibicao,
                  }
                : null,
        };
    }

    private async getAndamentoTarefaRet(
        transferencia_id: number,
        tarefa_id: number,
        workflow_id: number
    ): Promise<AndamentoTarefaDto | null> {
        const row = await this.prisma.transferenciaAndamentoTarefa.findFirst({
            where: {
                removido_em: null,
                workflow_tarefa_fluxo_id: tarefa_id,
                transferencia_andamento: {
                    transferencia_id: transferencia_id,
                },
            },
            select: {
                id: true,
                feito: true,
                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },

                workflow_tarefa: {
                    select: {
                        fluxoTarefas: {
                            take: 1,
                            where: {
                                fluxo_fase: {
                                    fluxo: {
                                        workflow_id: workflow_id,
                                    },
                                },
                            },
                            select: {
                                responsabilidade: true,
                            },
                        },
                    },
                },
            },
        });
        if (!row) return null;

        return {
            concluida: row.feito,
            necessita_preencher_orgao:
                !row.orgao_responsavel &&
                row.workflow_tarefa.fluxoTarefas[0].responsabilidade == WorkflowResponsabilidade.OutroOrgao
                    ? true
                    : false,
            orgao_responsavel: row.orgao_responsavel
                ? {
                      id: row.orgao_responsavel.id,
                      sigla: row.orgao_responsavel.sigla,
                      descricao: row.orgao_responsavel.descricao,
                  }
                : null,
        };
    }
}
