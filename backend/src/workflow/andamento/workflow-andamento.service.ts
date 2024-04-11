import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkflowService } from 'src/workflow/configuracao/workflow.service';
import { FilterWorkflowAndamentoDto } from './dto/filter-andamento.dto';
import { AndamentoFaseDto, AndamentoTarefaDto, WorkflowAndamentoDto } from './entities/workflow-andamento.entity';

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
            },
        });
        if (!transferencia || !transferencia.workflow_id) throw new Error('Transferência inválida ou não configurada');

        const workflow = await this.workflowService.findOne(transferencia.workflow_id, user);

        return {
            ...workflow,
            possui_proxima_etapa: true,
            pode_passar_para_proxima_etapa: true,

            fluxo: await Promise.all(
                workflow.fluxo.map(async (fluxo) => {
                    return {
                        ...fluxo,

                        fases: await Promise.all(
                            fluxo.fases.map(async (fase) => {
                                return {
                                    ...fase,
                                    andamento: await this.getAndamentoFaseRet(transferencia.id, fase.id!),

                                    tarefas: await Promise.all(
                                        fase.tarefas.map(async (tarefa) => {
                                            return {
                                                ...tarefa,

                                                andamento: await this.getAndamentoTarefaRet(
                                                    transferencia.id,
                                                    tarefa.workflow_tarefa!.id
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

    private async getAndamentoFaseRet(transferencia_id: number, fase_id: number): Promise<AndamentoFaseDto | null> {
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
            },
        });

        if (!row) return null;

        return {
            data_inicio: row.data_inicio,
            data_termino: row.data_termino,
            concluida: row.data_termino ? true : false,
            pode_concluir: true,

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
        tarefa_id: number
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
            },
        });
        if (!row) return null;

        return {
            concluida: row.feito,
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
