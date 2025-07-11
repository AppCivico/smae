import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterWorkflowAndamentoDto } from './dto/filter-andamento.dto';
import { AndamentoFaseDto, AndamentoTarefaDto, WorkflowAndamentoDto } from './entities/workflow-andamento.entity';
import { Prisma, WorkflowResponsabilidade } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { WorkflowIniciarProxEtapaDto } from './dto/iniciar-prox-etapa.dto';
import { DateTime } from 'luxon';
import { WorkflowService } from '../configuracao/workflow.service';
import { Date2YMD } from '../../../common/date2ymd';

@Injectable()
export class WorkflowAndamentoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async findAndamento(filter: FilterWorkflowAndamentoDto, user: PessoaFromJwt): Promise<WorkflowAndamentoDto | void> {
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
                workflow_finalizado: true,
                andamentoWorkflow: {
                    where: {
                        removido_em: null,
                    },
                    orderBy: [{ id: 'desc' }, { criado_em: 'desc' }],
                    select: {
                        id: true,
                        workflow_etapa_id: true,
                        data_termino: true,
                        data_inicio: true,
                    },
                },
            },
        });
        if (!transferencia || !transferencia.workflow_id) throw new Error('Transferência inválida ou não configurada');

        if (!transferencia.andamentoWorkflow.length) {
            return;
        }

        const workflow = await this.workflowService.findOne(transferencia.workflow_id, user);

        // Processando booleans de controle de etapa.
        let possui_proxima_etapa: boolean;

        // Descobrindo a fase atual para buscar a etapa atual.
        const faseAtualAndamento = transferencia.andamentoWorkflow
            .filter((e) => e.data_inicio != null)
            .find((e) => {
                return (e.data_inicio && !e.data_termino) || (e.data_inicio && e.data_termino);
            });

        if (!faseAtualAndamento) {
            throw new InternalServerErrorException('Não foi possível encontrar fase atual do workflow.');
        }

        const etapaAtual = workflow.fluxo.find((e) => {
            return e.workflow_etapa_de!.id == faseAtualAndamento.workflow_etapa_id;
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

            // Verificando se precisa ajustar col de controle.
            if (transferencia.workflow_finalizado == false) {
                await this.prisma.transferencia.update({
                    where: { id: transferencia.id },
                    data: {
                        workflow_finalizado: true,
                    },
                });
            }
        }

        const fasesNaoConcluidas = await this.prisma.transferenciaAndamento.count({
            where: {
                removido_em: null,
                data_termino: null,
                transferencia_id: transferencia.id,
                workflow_etapa_id: etapaAtual!.workflow_etapa_de!.id,
            },
        });

        const fasesConcluidas = await this.prisma.transferenciaAndamento.count({
            where: {
                removido_em: null,
                data_termino: { not: null },
                transferencia_id: transferencia.id,
            },
        });

        const pode_passar_para_proxima_etapa: boolean = fasesNaoConcluidas == 0 && possui_proxima_etapa ? true : false;
        const pode_reabrir_fase: boolean = fasesConcluidas ? true : false;

        // Buscando tarefas que são do cronograma.
        const tarefasCronograma = await this.prisma.tarefa.findMany({
            where: {
                tarefa_cronograma: {
                    transferencia_id: transferencia.id,
                    removido_em: null,
                },
                distribuicao_recurso: {
                    removido_em: null,
                    transferencia_id: transferencia.id,
                },
                removido_em: null,
                nivel: 3,
            },
            orderBy: [{ tarefa_pai_id: 'asc' }, { numero: 'asc' }],
            select: {
                id: true,
                tarefa_pai_id: true,
                tarefa: true,
                numero: true,
                inicio_real: true,
                termino_real: true,
                eh_marco: true,
                orgao: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
            },
        });

        return {
            ...workflow,
            possui_proxima_etapa: possui_proxima_etapa,
            pode_passar_para_proxima_etapa: pode_passar_para_proxima_etapa,
            pode_reabrir_fase: pode_reabrir_fase,
            fluxo: await Promise.all(
                workflow.fluxo.map(async (fluxo) => {
                    const ehEtapaAtual = fluxo.workflow_etapa_de!.id == faseAtualAndamento!.workflow_etapa_id;
                    const faseIds = fluxo.fases.map((fase) => fase.fase!.id);
                    const concluida = await this.isEtapaConcluida(
                        transferencia.id,
                        fluxo.workflow_etapa_de!.id,
                        faseIds
                    );

                    return {
                        ...fluxo,
                        atual: ehEtapaAtual,
                        concluida: concluida,
                        fases: await Promise.all(
                            fluxo.fases.map(async (fase) => {
                                const tarefasVindasDoCronograma = [];

                                // Buscando o andamento da fase.
                                const andamentoFase = await this.getAndamentoFaseRet(
                                    transferencia.id,
                                    fase.fase!.id,
                                    transferencia.workflow_id!,
                                    fluxo.workflow_etapa_de!.id
                                );

                                // Verificando se a fase possui tarefas de cronograma que precisam ser inseridas no retorno.
                                if (andamentoFase && andamentoFase.tarefa_espelhada_id) {
                                    const tarefasCronogramaFase = tarefasCronograma.filter(
                                        (tarefa) => tarefa.tarefa_pai_id == andamentoFase.tarefa_espelhada_id
                                    );

                                    if (tarefasCronogramaFase.length) {
                                        tarefasVindasDoCronograma.push(
                                            ...tarefasCronogramaFase.map((tarefa) => {
                                                return {
                                                    tarefa_cronograma_id: tarefa.id,
                                                    workflow_tarefa: {
                                                        id: 0,
                                                        descricao: tarefa.tarefa,
                                                    },
                                                    ordem: tarefa.numero,
                                                    marco: tarefa.eh_marco,
                                                    responsabilidade: WorkflowResponsabilidade.OutroOrgao,
                                                    andamento: {
                                                        id: null,
                                                        orgao_responsavel: tarefa.orgao,
                                                        necessita_preencher_orgao: false,
                                                        concluida: tarefa.termino_real ? true : false,
                                                        atual: false,
                                                        termino_real: Date2YMD.toStringOrNull(tarefa.termino_real),
                                                        inicio_real: Date2YMD.toStringOrNull(tarefa.inicio_real),
                                                    },
                                                };
                                            })
                                        );
                                    }
                                }

                                const tarefasConfiguradas = await Promise.all(
                                    fase.tarefas
                                        .filter((t) => {
                                            // TODO?: as tarefas do cronograma, poderiam ter entradas na tabela de andamento de tarefa do workflow, assim eliminaríamos a necessidade de filtrar aqui.
                                            // Filtrando para não "duplicar" tarefas.
                                            if (tarefasVindasDoCronograma.length > 0) {
                                                return t.responsabilidade !== WorkflowResponsabilidade.OutroOrgao;
                                            }
                                            return true;
                                        })
                                        .map(async (tarefa) => {
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
                                );

                                // Adicionando tarefas vindas do cronograma e ordenando.
                                const tarefasDaFase = [...tarefasConfiguradas, ...tarefasVindasDoCronograma];
                                tarefasDaFase.sort((a, b) => a.ordem! - b.ordem!);

                                return {
                                    ...fase,
                                    andamento: andamentoFase,
                                    tarefas: tarefasDaFase,
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
        workflow_id: number,
        etapa_id: number
    ): Promise<AndamentoFaseDto | null> {
        const row = await this.prisma.transferenciaAndamento.findFirst({
            where: {
                removido_em: null,
                transferencia_id: transferencia_id,
                workflow_fase_id: fase_id,
                workflow_etapa_id: etapa_id,
            },
            select: {
                data_inicio: true,
                data_termino: true,

                tarefaEspelhada: {
                    select: {
                        id: true,
                    },
                },

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

        // Descobrindo se a fase é a atual.
        const faseAtual = row.data_inicio && !row.data_termino ? true : false;

        return {
            atual: faseAtual,
            data_inicio: Date2YMD.toStringOrNull(row.data_inicio),
            data_termino: Date2YMD.toStringOrNull(row.data_termino),
            dias_na_fase: dias_na_fase,
            concluida: row.data_termino ? true : false,
            pode_concluir: row.data_inicio ? true : false,

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

            tarefa_espelhada_id: row.tarefaEspelhada ? row.tarefaEspelhada[0].id : null,
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
        return await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId | void> => {
                return await this.iniciarProximaEtapaInternal(dto, user, prismaTxn);
            }
        );
    }

    public async iniciarProximaEtapaInternal(
        dto: WorkflowIniciarProxEtapaDto,
        user: PessoaFromJwt,
        prismaTxn: Prisma.TransactionClient
    ): Promise<RecordWithId | void> {
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
                    where: {
                        data_termino: { not: null },
                    },
                    select: {
                        workflow_etapa_id: true,
                        data_termino: true,
                    },
                },

                TarefaCronograma: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        if (!transferencia)
            throw new HttpException('transferencia_id| Transferência com workflow, não encontrada.', 400);

        if (!transferencia.andamentoWorkflow.length)
            throw new HttpException('Transferência sem linhas de andamento', 400);

        const etapaAtual = await prismaTxn.fluxo.findFirst({
            where: {
                workflow_id: transferencia.workflow_id!,
                removido_em: null,
                fluxo_etapa_de_id: transferencia.andamentoWorkflow[0].workflow_etapa_id,
            },
            select: {
                fluxo_etapa_de: {
                    select: {
                        etapa_fluxo: true,
                    },
                },
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
                            'Fase é de responsabilidade própria, mas não foi encontrado órgão da SERI',
                            400
                        );

                    orgao_id = orgaoCasaCivil.id;
                }

                const andamentoProxEtapa = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        transferencia_id: transferencia.id,
                        workflow_etapa_id: configProxEtapa.fluxo_etapa_de_id,
                        workflow_fase_id: primeiraFase.fase.id,
                        data_inicio: null,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        workflow_etapa_id: true,
                        workflow_fase_id: true,
                        tarefaEspelhada: {
                            select: {
                                id: true,
                            },
                        },

                        tarefas: {
                            select: {
                                id: true,
                                tarefaEspelhada: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (!andamentoProxEtapa) throw new Error('Próxima fase já deveria estar populada.');

                // Tarefa referente à etapa.
                await prismaTxn.tarefa.update({
                    where: { id: andamentoProxEtapa.tarefaEspelhada[0].id },
                    data: {
                        inicio_real: new Date(Date.now()),
                        atualizado_em: new Date(Date.now()),
                    },
                });

                // Tarefa(s) referente ao nível de tarefas.
                for (const tarefa of andamentoProxEtapa.tarefas) {
                    await prismaTxn.tarefa.updateMany({
                        where: { id: tarefa.tarefaEspelhada[0].id },
                        data: {
                            inicio_real: new Date(Date.now()),
                            atualizado_em: new Date(Date.now()),
                        },
                    });
                }

                // Tarefa do cronograma referente à fase anterior e acompanhamento.
                await prismaTxn.tarefa.updateMany({
                    where: {
                        tarefa_cronograma_id: transferencia.TarefaCronograma[0].id!,
                        OR: [
                            {
                                tarefa: etapaAtual.fluxo_etapa_de.etapa_fluxo,
                                nivel: 1,
                            },
                            {
                                tarefa_pai: {
                                    tarefa: etapaAtual.fluxo_etapa_de.etapa_fluxo,
                                },
                                nivel: 2,
                            },
                        ],
                    },
                    data: {
                        termino_real: new Date(Date.now()),
                        atualizado_em: new Date(Date.now()),
                    },
                });

                await prismaTxn.transferencia.update({
                    where: { id: dto.transferencia_id },
                    data: {
                        workflow_etapa_atual_id: andamentoProxEtapa.workflow_etapa_id,
                        workflow_fase_atual_id: andamentoProxEtapa.workflow_fase_id,
                    },
                });

                return await prismaTxn.transferenciaAndamento.update({
                    where: { id: andamentoProxEtapa.id },
                    data: {
                        orgao_responsavel_id: orgao_id,
                        data_inicio: new Date(Date.now()),
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: {
                        id: true,
                    },
                });
            } else {
                await prismaTxn.transferencia.update({
                    where: { id: dto.transferencia_id },
                    data: {
                        workflow_finalizado: true,
                    },
                });
                return;
            }
        } else {
            throw new Error(
                'Não foi possível encontrar configurações de fluxo para este workflow seguindo estes parâmetros'
            );
        }
    }

    private async isEtapaConcluida(transferencia_id: number, etapa_id: number, faseIds: number[]): Promise<boolean> {
        const count = await this.prisma.transferenciaAndamento.count({
            where: {
                transferencia_id: transferencia_id,
                workflow_etapa_id: etapa_id,
                workflow_fase_id: { in: faseIds },
                removido_em: null,
                data_termino: { not: null }, // Only completed phases
            },
        });

        // Stage is complete if all its phases are completed
        return count === faseIds.length;
    }
}
