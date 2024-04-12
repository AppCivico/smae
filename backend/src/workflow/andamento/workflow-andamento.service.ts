import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkflowService } from 'src/workflow/configuracao/workflow.service';
import { FilterWorkflowAndamentoDto } from './dto/filter-andamento.dto';
import { AndamentoFaseDto, AndamentoTarefaDto, WorkflowAndamentoDto } from './entities/workflow-andamento.entity';
import { Prisma, WorkflowResponsabilidade, WorkflowSituacaoTipo } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { WorkflowIniciarProxEtapaDto } from './dto/iniciar-prox-etapa.dto';

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
                                            fase.fase!.id,
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

        if (!row.workflow_fase.fluxos.length)
            throw new HttpException('Falha ao buscar configuração de fase para o Workflow', 400);

        const responsabilidadeFase: WorkflowResponsabilidade = row.workflow_fase.fluxos[0].responsabilidade;

        return {
            data_inicio: row.data_inicio,
            data_termino: row.data_termino,
            concluida: row.data_termino ? true : false,
            pode_concluir: pode_concluir,

            necessita_preencher_orgao:
                row.orgao_responsavel == null && responsabilidadeFase == WorkflowResponsabilidade.OutroOrgao
                    ? true
                    : false,

            necessita_preencher_pessoa:
                row.pessoa_responsavel == null && responsabilidadeFase == WorkflowResponsabilidade.OutroOrgao
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

    async iniciarProximaEtapa(dto: WorkflowIniciarProxEtapaDto, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
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
                        orderBy: { data_termino: 'desc' },
                        select: {
                            workflow_etapa_id: true,
                            data_termino: true,

                            workflow_etapa: {
                                select: {
                                    fluxoDestino: {
                                        where: { removido_em: null },
                                        select: {
                                            id: true,
                                            fluxo_etapa_para_id: true,
                                            workflow_id: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!transferencia)
                throw new HttpException('transferencia_id| Transferência com workflow, não encontrada.', 400);

            if (
                transferencia.andamentoWorkflow.find((e) => {
                    return e.data_termino == null;
                })
            )
                throw new HttpException('Ainda há fase(s) abertas na etapa atual desta transferência.', 400);

            if (!transferencia.andamentoWorkflow.length)
                throw new HttpException('Transferência sem linhas de andamento', 400);

            // rows de Andamento estão com order by por ultima data de conclusão desc.
            const andamentoMaisRecente = transferencia.andamentoWorkflow[0];
            if (andamentoMaisRecente.workflow_etapa.fluxoDestino.length) {
                // Garantindo que a config de workflow é a correta.
                // Só deve ter uma linha de 'fluxo'.
                const configFluxo = andamentoMaisRecente.workflow_etapa.fluxoDestino.find((e) => {
                    return e.workflow_id == transferencia.workflow_id;
                });
                if (!configFluxo) throw new HttpException('Configuração de fluxo não encontrada para o workflow.', 400);

                // Buscando config da próxima etapa.
                const configProxEtapa = await prismaTxn.fluxo.findFirst({
                    where: {
                        fluxo_etapa_de_id: configFluxo.fluxo_etapa_para_id,
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

                                situacoes: {
                                    where: {
                                        situacao: {
                                            OR: [
                                                { tipo_situacao: WorkflowSituacaoTipo.NaoIniciado },
                                                { tipo_situacao: WorkflowSituacaoTipo.EmAndamento },
                                            ],
                                        },
                                    },
                                    select: {
                                        situacao: {
                                            select: {
                                                id: true,
                                                tipo_situacao: true,
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

                if (!configProxEtapa.fases.length) throw new HttpException('Próxima etapa não possui fases', 400);

                if (!configProxEtapa.fases[0].situacoes.length)
                    throw new Error('Primeira fase da próxima etapa não possui configuração de status Inicial');

                const primeiraFase = configProxEtapa.fases[0];
                const situacaoFaseInicial = primeiraFase.situacoes!.find((s) => {
                    return (
                        s.situacao.tipo_situacao == WorkflowSituacaoTipo.NaoIniciado ||
                        s.situacao.tipo_situacao == WorkflowSituacaoTipo.EmAndamento
                    );
                });
                if (!situacaoFaseInicial) throw new HttpException('Falha ao encontrar situação inicial', 400);

                return await prismaTxn.transferenciaAndamento.create({
                    data: {
                        transferencia_id: transferencia.id,
                        workflow_etapa_id: configProxEtapa.fluxo_etapa_de_id,
                        workflow_fase_id: primeiraFase.id,
                        workflow_situacao_id: situacaoFaseInicial.situacao.id,
                        pessoa_responsavel_id:
                            primeiraFase.responsabilidade == WorkflowResponsabilidade.Propria ? user.id : null,
                        data_inicio: new Date(Date.now()),
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),

                        tarefas: {
                            createMany: {
                                data: primeiraFase.tarefas.map((e) => {
                                    return {
                                        workflow_tarefa_fluxo_id: e.workflow_tarefa!.id,
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
                throw new Error(
                    'Não foi possível encontrar configurações de fluxo para este workflow seguindo estes parâmetros'
                );
            }
        });
    }
}
