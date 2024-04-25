import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkflowService } from 'src/workflow/configuracao/workflow.service';
import { FilterWorkflowAndamentoDto } from './dto/filter-andamento.dto';
import { AndamentoFaseDto, AndamentoTarefaDto, WorkflowAndamentoDto } from './entities/workflow-andamento.entity';
import { Prisma, WorkflowResponsabilidade } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { WorkflowIniciarProxEtapaDto } from './dto/iniciar-prox-etapa.dto';
import { DateTime } from 'luxon';

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
                        data_inicio: { not: null },
                    },
                    take: 1,
                    orderBy: [{ id: 'desc' }, { criado_em: 'desc' }],
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

        // Processando booleans de controle de etapa.
        let possui_proxima_etapa: boolean;

        const etapaAtual = workflow.fluxo.find((e) => {
            return e.workflow_etapa_de!.id == transferencia.andamentoWorkflow[0].workflow_etapa_id;
        });
        const proxEtapa = etapaAtual!.workflow_etapa_para;

        // Caso a prox etapa não possua fases. É o fim do workflow
        if (proxEtapa) {
            const fluxoProxEtapa = await this.prisma.fluxo.findFirst({
                where: {
                    workflow_id: transferencia.workflow_id,
                    fluxo_etapa_de_id: proxEtapa.id,
                    removido_em: null,
                },
                select: {
                    id: true,

                    fases: {
                        where: { removido_em: null },
                        select: {
                            fase_id: true,
                        },
                    },
                },
            });

            possui_proxima_etapa = fluxoProxEtapa && fluxoProxEtapa.fases.length ? true : false;
        } else {
            possui_proxima_etapa = false;
        }

        const fasesNaoConcluidas = await this.prisma.transferenciaAndamento.count({
            where: {
                removido_em: null,
                data_termino: null,
                transferencia_id: transferencia.id,
                workflow_etapa_id: etapaAtual!.workflow_etapa_de!.id,
            },
        });

        const fasesPendentesParaEtapaAtual = await this.prisma.fluxo.count({
            where: {
                removido_em: null,
                workflow_id: transferencia.workflow_id,
                fluxo_etapa_de_id: etapaAtual!.workflow_etapa_de!.id,
            },
        });

        const pode_passar_para_proxima_etapa: boolean =
            fasesPendentesParaEtapaAtual == 0 && fasesNaoConcluidas == 0 && possui_proxima_etapa ? true : false;

        return {
            ...workflow,
            possui_proxima_etapa: possui_proxima_etapa,
            pode_passar_para_proxima_etapa: pode_passar_para_proxima_etapa,

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
                                            fase.fase!.id,
                                            transferencia.workflow_id!
                                        ),

                                        tarefas: await Promise.all(
                                            fase.tarefas.map(async (tarefa) => {
                                                return {
                                                    ...tarefa,

                                                    andamento: await this.getAndamentoTarefaRet(
                                                        fase.fase!.id,
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
                                    removido_em: null,
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
        if (!row.workflow_fase.fluxos.length)
            throw new HttpException('Falha ao buscar configuração de fase para o Workflow', 400);

        const responsabilidadeFase: WorkflowResponsabilidade = row.workflow_fase.fluxos[0].responsabilidade;

        const now = DateTime.now().startOf('day');

        let dias_na_fase: number;
        if (!row.data_inicio) {
            dias_na_fase = 0;
        } else if (row.data_termino) {
            dias_na_fase =
                DateTime.fromJSDate(row.data_termino).startOf('day').toMillis ==
                DateTime.fromJSDate(row.data_inicio).startOf('day').toMillis
                    ? 1
                    : DateTime.fromJSDate(row.data_termino).diff(DateTime.fromJSDate(row.data_inicio)).as('days');
        } else {
            dias_na_fase =
                DateTime.fromJSDate(row.data_inicio).startOf('day').toMillis() == now.toMillis()
                    ? 1
                    : Math.trunc(now.diff(DateTime.fromJSDate(row.data_inicio, { zone: 'utc' })).as('days'));
        }

        return {
            data_inicio: row.data_inicio,
            data_termino: row.data_termino,
            dias_na_fase: dias_na_fase,
            concluida: row.data_termino ? true : false,
            pode_concluir: true,

            necessita_preencher_orgao: responsabilidadeFase == WorkflowResponsabilidade.OutroOrgao ? true : false,

            necessita_preencher_pessoa: responsabilidadeFase == WorkflowResponsabilidade.OutroOrgao ? true : false,

            situacao: row.workflow_situacao
                ? {
                      id: row.workflow_situacao.id,
                      situacao: row.workflow_situacao.situacao,
                      tipo_situacao: row.workflow_situacao.tipo_situacao,
                  }
                : null,

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
        fase_id: number,
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
                    workflow_fase_id: fase_id,
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
            id: row.id,
            concluida: row.feito,
            necessita_preencher_orgao:
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

    async iniciarProximaEtapa(dto: WorkflowIniciarProxEtapaDto, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId | void> => {
            // Verificando se a etapa atual está concluída e se a configuração para a prox etapa existe.
            const transferencia = await prismaTxn.transferencia.findFirst({
                where: {
                    id: dto.transferencia_id,
                    removido_em: null,
                    workflow_id: { not: null },
                },
                select: {
                    id: true,
                    workflow_id: true,

                    andamentoWorkflow: {
                        orderBy: { id: 'desc' },
                        select: {
                            workflow_etapa_id: true,
                            data_termino: true,
                        },
                    },
                },
            });
            if (!transferencia)
                throw new HttpException('transferencia_id| Transferência com workflow, não encontrada.', 400);

            if (!transferencia.andamentoWorkflow.length)
                throw new HttpException('Transferência sem linhas de andamento', 400);
            console.log(transferencia.andamentoWorkflow);
            if (
                transferencia.andamentoWorkflow.find((e) => {
                    return e.data_termino == null;
                })
            )
                throw new HttpException('Ainda há fase(s) abertas na etapa atual desta transferência.', 400);

            const etapaAtual = await prismaTxn.fluxo.findFirst({
                where: {
                    workflow_id: transferencia.workflow_id!,
                    removido_em: null,
                    fluxo_etapa_de_id: transferencia.andamentoWorkflow[0].workflow_etapa_id,
                },
                select: {
                    fluxo_etapa_para_id: true,
                },
            });
            if (!etapaAtual) throw new Error('Erro ao encontrar etapa atual');

            if (etapaAtual.fluxo_etapa_para_id) {
                // Buscando config da próxima etapa.
                const configProxEtapa = await prismaTxn.fluxo.findFirst({
                    where: {
                        fluxo_etapa_de_id: etapaAtual.fluxo_etapa_para_id,
                        workflow_id: transferencia.workflow_id!,
                        removido_em: null,
                    },
                    select: {
                        fluxo_etapa_de_id: true,
                        fases: {
                            where: { removido_em: null },
                            orderBy: { ordem: 'asc' },
                            take: 1,
                            select: {
                                id: true,
                                ordem: true,
                                responsabilidade: true,
                                fase: {
                                    select: {
                                        id: true,
                                        fase: true, // Nome da fase
                                    },
                                },

                                tarefas: {
                                    where: { removido_em: null },
                                    orderBy: { ordem: 'asc' },
                                    select: {
                                        responsabilidade: true,
                                        workflow_tarefa: {
                                            select: {
                                                id: true,
                                                tarefa_fluxo: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });

                if (!configProxEtapa)
                    throw new HttpException('Não foi possível encontrar configuração da próxima Etapa', 400);

                // Caso a próx. Etapa não possua fases.
                // É o fim do workflow
                if (configProxEtapa.fases.length) {
                    const primeiraFase = configProxEtapa.fases[0];

                    // Caso a fase seja de responsabilidade própria, pegando órgão da casa civil.
                    let orgao_id: number | null = null;
                    if (primeiraFase.responsabilidade == WorkflowResponsabilidade.Propria) {
                        const orgaoCasaCivil = await prismaTxn.orgao.findFirst({
                            where: {
                                removido_em: null,
                                sigla: 'SERI',
                            },
                            select: {
                                id: true,
                            },
                        });
                        if (!orgaoCasaCivil)
                            throw new HttpException(
                                'Fase é de responsabilidade própria, mas não foi encontrado órgão da Casa Civil',
                                400
                            );

                        orgao_id = orgaoCasaCivil.id;
                    }

                    return await prismaTxn.transferenciaAndamento.create({
                        data: {
                            transferencia_id: transferencia.id,
                            workflow_etapa_id: configProxEtapa.fluxo_etapa_de_id,
                            workflow_fase_id: primeiraFase.fase.id,
                            orgao_responsavel_id: orgao_id,
                            data_inicio: new Date(Date.now()),
                            criado_por: user.id,
                            criado_em: new Date(Date.now()),

                            tarefas: {
                                createMany: {
                                    data: primeiraFase.tarefas.map((e) => {
                                        return {
                                            workflow_tarefa_fluxo_id: e.workflow_tarefa!.id,
                                            orgao_responsavel_id:
                                                e.responsabilidade == WorkflowResponsabilidade.Propria
                                                    ? orgao_id
                                                    : null,
                                            criado_por: user.id,
                                            criado_em: new Date(Date.now()),
                                        };
                                    }),
                                },
                            },
                        },
                        select: {
                            id: true,
                        },
                    });
                } else {
                    return;
                }
            } else {
                throw new Error(
                    'Não foi possível encontrar configurações de fluxo para este workflow seguindo estes parâmetros'
                );
            }
        });
    }
}
