import { HttpException, Injectable } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma, TransferenciaHistoricoAcao, WorkflowResponsabilidade } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    UpdateWorkflowAndamentoFaseDto,
    WorkflowFinalizarIniciarFaseDto,
    WorkflowReabrirFaseAnteriorDto,
} from './dto/patch-workflow-andamento-fase.dto';
import { WorkflowService } from '../../configuracao/workflow.service';

@Injectable()
export class WorkflowAndamentoFaseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async update(dto: UpdateWorkflowAndamentoFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Encontrando row na table transferencia_andamento
                const self = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        workflow_fase_id: dto.fase_id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        orgao_responsavel_id: true,
                        pessoa_responsavel_id: true,
                        workflow_situacao_id: true,
                        workflow_fase_id: true,
                        workflow_etapa_id: true,
                        transferencia: {
                            select: {
                                workflow_id: true,
                            },
                        },

                        tarefaEspelhada: {
                            select: {
                                id: true,
                            },
                        },
                    },
                });
                if (!self) throw new Error('Não foi encontrada um registro de andamento para esta fase');

                if (!self.transferencia.workflow_id)
                    throw new Error('Transferência não possui configuração de Workflow.');

                // Caso a situação seja modificada. Deve verificar se ela existe na config do Workflow.
                if (dto.situacao_id != undefined && self.workflow_situacao_id != dto.situacao_id) {
                    const situacaoNaConfig = await prismaTxn.fluxoFaseSituacao.count({
                        where: {
                            fluxo_fase: {
                                fase_id: dto.fase_id,
                                removido_em: null,
                            },
                            situacao_id: dto.situacao_id,
                        },
                    });
                    if (!situacaoNaConfig)
                        throw new HttpException(
                            'situacao_id| Situação não está presente na configuração do Workflow.',
                            400
                        );
                }

                if (
                    (dto.orgao_responsavel_id != undefined || dto.pessoa_responsavel_id != undefined) &&
                    (self.orgao_responsavel_id != dto.orgao_responsavel_id ||
                        self.pessoa_responsavel_id != dto.pessoa_responsavel_id)
                ) {
                    const orgaoCasaCivil = await prismaTxn.orgao.findFirstOrThrow({
                        where: {
                            removido_em: null,
                            sigla: 'SERI',
                        },
                        select: {
                            id: true,
                        },
                    });

                    const configFluxoFase = await prismaTxn.fluxoFase.findFirst({
                        where: {
                            removido_em: null,
                            fase_id: self.workflow_fase_id,
                            fluxo: {
                                workflow_id: self.transferencia.workflow_id!,
                                fluxo_etapa_de_id: self.workflow_etapa_id,
                                removido_em: null,
                            },
                        },
                        select: {
                            responsabilidade: true,
                        },
                    });
                    if (!configFluxoFase)
                        throw new Error(
                            'Não foi possível encontrar configuração de Fluxo Fase para editar órgão responsável.'
                        );

                    // Caso seja modificado o órgão responsável, é necessário verificar o tipo de responsabilidade da fase.
                    if (
                        dto.orgao_responsavel_id != undefined &&
                        dto.orgao_responsavel_id != orgaoCasaCivil.id &&
                        configFluxoFase.responsabilidade === WorkflowResponsabilidade.Propria
                    ) {
                        throw new HttpException(
                            'orgao_responsavel_id| Fase é de responsabilidade própria e portanto não deve ser atribuida a outro órgão.',
                            400
                        );
                    }
                }

                const updated = await prismaTxn.transferenciaAndamento.update({
                    where: { id: self.id },
                    data: {
                        workflow_situacao_id: dto.situacao_id,
                        orgao_responsavel_id: dto.orgao_responsavel_id,
                        pessoa_responsavel_id: dto.pessoa_responsavel_id,
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });

                // Atualizando tarefa no cronograma.
                let recursos: string | undefined;
                if (dto.pessoa_responsavel_id != undefined) {
                    const pessoa = await prismaTxn.pessoa.findFirstOrThrow({
                        where: { id: dto.pessoa_responsavel_id },
                        select: { nome_exibicao: true },
                    });

                    recursos = pessoa.nome_exibicao;
                }

                await prismaTxn.tarefa.update({
                    where: { id: self.tarefaEspelhada[0].id },
                    data: {
                        orgao_id: dto.orgao_responsavel_id,
                        recursos: recursos,
                    },
                });

                if (dto.tarefas != undefined && dto.tarefas.length > 0) {
                    await this.atualizarTarefas(dto, user, prismaTxn);
                }

                return { id: updated.id };
            }
        );

        return updated;
    }

    async atualizarTarefas(
        dto: UpdateWorkflowAndamentoFaseDto,
        user: PessoaFromJwt,
        prismaTxn: Prisma.TransactionClient
    ): Promise<RecordWithId[]> {
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
                data_inicio: true,
                transferencia: {
                    select: {
                        workflow_id: true,
                    },
                },
            },
        });
        if (!transferenciaAndamento) throw new Error('Não foi encontrada um registro de andamento para esta fase');

        if (transferenciaAndamento.data_inicio == null) throw new HttpException('Fase deve ser iniciada.', 400);

        if (!transferenciaAndamento.transferencia.workflow_id)
            throw new Error('Transferência não possui configuração de Workflow.');

        const orgaoCasaCivil = await prismaTxn.orgao.findFirstOrThrow({
            where: {
                removido_em: null,
                sigla: 'SERI',
            },
            select: {
                id: true,
            },
        });

        const operations = [];
        const idsAtualizados: RecordWithId[] = [];
        if (dto.tarefas != undefined) {
            for (const tarefa of dto.tarefas) {
                // Verificando se esta tarefa está de fato na configuração do Workflow.
                const tarefaWorkfloConfig = await prismaTxn.fluxoTarefa.findFirst({
                    where: {
                        removido_em: null,
                        workflow_tarefa_id: tarefa.id,

                        fluxo_fase: {
                            fase_id: dto.fase_id,
                            fluxo: {
                                workflow_id: transferenciaAndamento.transferencia.workflow_id,
                            },
                        },
                    },
                    select: {
                        responsabilidade: true,

                        workflow_tarefa: {
                            select: {
                                id: true,
                                tarefa_fluxo: true,
                            },
                        },
                    },
                });
                if (!tarefaWorkfloConfig) throw new Error('Tarefa não existe na configuração do Workflow.');

                // Verificando necessidade de preencher órgão responsável.
                if (
                    tarefaWorkfloConfig.responsabilidade == WorkflowResponsabilidade.Propria &&
                    tarefa.orgao_responsavel_id != undefined &&
                    tarefa.orgao_responsavel_id != orgaoCasaCivil.id
                )
                    throw new HttpException(
                        `orgao_responsavel_id| Órgão não deve ser enviado para tarefa ${tarefaWorkfloConfig.workflow_tarefa.tarefa_fluxo}, pois é de responsabilidade própria.`,
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
                        tarefaEspelhada: {
                            select: {
                                id: true,
                                termino_real: true,
                                percentual_concluido: true,
                            },
                        },
                    },
                });
                if (!transferenciaAndamentoTarefaRow)
                    throw new Error(
                        'Não foi encontrado registro de andamento para a tarefa. Fase anterior não foi fechada ou está em fase Terminal.'
                    );

                if (
                    tarefaWorkfloConfig.responsabilidade == WorkflowResponsabilidade.OutroOrgao &&
                    !tarefa.orgao_responsavel_id &&
                    !transferenciaAndamentoTarefaRow.orgao_responsavel_id
                )
                    throw new HttpException(
                        `orgao_responsavel_id| Órgão deve ser enviado para tarefa "${tarefaWorkfloConfig.workflow_tarefa.tarefa_fluxo}", pois é de responsabilidade de outro órgão.`,
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

                    const tarefaExistente = await prismaTxn.tarefa.findFirst({
                        where: { id: transferenciaAndamentoTarefaRow.tarefaEspelhada[0].id },
                        select: {
                            id: true,
                            inicio_real: true,
                            termino_real: true,
                        },
                    });
                    console.log('========================');
                    console.log(tarefaExistente);
                    console.log('========================');

                    operations.push(
                        prismaTxn.tarefa.update({
                            where: { id: transferenciaAndamentoTarefaRow.tarefaEspelhada[0].id },
                            data: {
                                termino_real: tarefa.concluida == true ? new Date(Date.now()) : null,
                                orgao_id: tarefa.orgao_responsavel_id,
                                percentual_concluido: tarefa.concluida == true ? 100 : 0,
                                atualizado_em: new Date(Date.now()),
                            },
                        })
                    );

                    idsAtualizados.push({ id: transferenciaAndamentoTarefaRow.id });
                }
            }

            await Promise.all(operations);
        }

        return idsAtualizados;
    }

    async finalizarFase(dto: WorkflowFinalizarIniciarFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Encontrando row na table transferencia_andamento
                const self = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        workflow_fase_id: dto.fase_id,
                        removido_em: null,
                        data_termino: null,
                    },
                    select: {
                        id: true,
                        transferencia_id: true,
                        orgao_responsavel_id: true,
                        pessoa_responsavel_id: true,
                        workflow_fase_id: true,
                        workflow_etapa_id: true,
                        data_termino: true,
                        workflow_situacao: {
                            select: {
                                id: true,
                                tipo_situacao: true,
                            },
                        },

                        tarefas: {
                            select: {
                                id: true,
                                feito: true,
                            },
                        },

                        transferencia: {
                            select: {
                                workflow_id: true,
                            },
                        },

                        tarefaEspelhada: {
                            select: {
                                id: true,
                            },
                        },
                    },
                });
                if (!self) throw new Error('Não foi encontrada um registro de andamento para esta fase');

                if (!self.transferencia.workflow_id)
                    throw new Error('Transferência não possui configuração de Workflow.');

                if (self.data_termino != null) {
                    throw new HttpException('Fase já foi finalizada.', 400);
                }

                // Finalizando a fase.
                await prismaTxn.transferenciaAndamento.update({
                    where: { id: self.id },
                    data: {
                        data_termino: new Date(Date.now()),
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                });

                await prismaTxn.tarefa.update({
                    where: { id: self.tarefaEspelhada[0].id },
                    data: {
                        percentual_concluido: 100,
                        termino_real: new Date(Date.now()),
                        atualizado_em: new Date(Date.now()),
                    },
                });

                return { id: self.id };
            }
        );

        return updated;
    }

    async iniciarFase(dto: WorkflowFinalizarIniciarFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferencia = await prismaTxn.transferencia.findFirstOrThrow({
                    where: {
                        id: dto.transferencia_id,
                        removido_em: null,
                    },
                    select: {
                        workflow_etapa_atual_id: true,
                        workflow_fase_atual_id: true,
                    },
                });

                // Buscando fase atual.
                const faseAtual = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        removido_em: null,
                        data_inicio: { not: null },
                        data_termino: { not: null },
                        workflow_etapa_id: transferencia.workflow_etapa_atual_id
                            ? transferencia.workflow_etapa_atual_id
                            : undefined,
                        workflow_fase_id: transferencia.workflow_fase_atual_id
                            ? transferencia.workflow_fase_atual_id
                            : undefined,
                    },
                    orderBy: [{ data_termino: 'asc' }, { atualizado_em: 'desc' }],
                    select: {
                        id: true,
                        workflow_fase_id: true,
                        workflow_etapa_id: true,
                        data_termino: true,
                    },
                });
                if (!faseAtual) throw new HttpException('Não foi possível verificar conclusão da fase anterior', 400);
                if (!faseAtual.data_termino)
                    throw new HttpException('Fase atual precisa ser finalizada antes de iniciar uma nova', 400);

                // Procurando a próxima fase e iniciando-a.
                const configFluxoFaseAtual = await prismaTxn.fluxoFase.findFirst({
                    where: {
                        removido_em: null,
                        fase_id: faseAtual.workflow_fase_id,
                        fluxo: {
                            fluxo_etapa_de_id: faseAtual.workflow_etapa_id,
                            removido_em: null,
                        },
                    },
                    select: {
                        fase_id: true,
                        ordem: true,
                    },
                });
                if (!configFluxoFaseAtual)
                    throw new Error('Não foi encontrada configuração da Fase atual no Workflow.');

                const configFluxoFaseSeguinte = await prismaTxn.fluxoFase.findFirst({
                    where: {
                        removido_em: null,
                        fase_id: dto.fase_id,
                        fluxo: {
                            fluxo_etapa_de_id: faseAtual.workflow_etapa_id,
                            removido_em: null,
                        },
                    },
                    orderBy: { ordem: 'asc' },
                    select: {
                        fase_id: true,
                        ordem: true,
                        responsabilidade: true,
                        tarefas: {
                            select: {
                                responsabilidade: true,
                                workflow_tarefa: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (!configFluxoFaseSeguinte)
                    throw new HttpException('Não foi possível encontrar configuração da próxima fase', 400);

                if (configFluxoFaseAtual.fase_id == configFluxoFaseSeguinte.fase_id)
                    throw new Error('Erro ao definir próxima fase.');

                // Caso a fase seja de responsabilidade própria, pegando órgão da casa civil.
                let orgao_id: number | null = null;
                if (configFluxoFaseSeguinte.responsabilidade == WorkflowResponsabilidade.Propria) {
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
                console.log('========================');
                console.log(configFluxoFaseAtual);
                console.log(configFluxoFaseSeguinte);
                console.log(faseAtual.workflow_etapa_id);
                console.log(configFluxoFaseSeguinte.fase_id);
                console.log('========================');
                const andamentoNovaFase = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        removido_em: null,
                        transferencia_id: dto.transferencia_id,
                        workflow_etapa_id: faseAtual.workflow_etapa_id, // Aqui não tem problema reaproveitar o workflow_etapa_id, pois está na mesma etapa.
                        workflow_fase_id: configFluxoFaseSeguinte.fase_id,
                        data_inicio: null,
                    },
                    select: {
                        id: true,
                        workflow_fase_id: true,
                        tarefaEspelhada: {
                            select: {
                                id: true,
                            },
                        },

                        tarefas: {
                            select: {
                                tarefaEspelhada: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (!andamentoNovaFase) throw new HttpException('Erro interno, fase já deveria estar populada.', 400);

                await prismaTxn.transferenciaAndamento.update({
                    where: { id: andamentoNovaFase.id },
                    data: {
                        data_inicio: new Date(Date.now()),
                        orgao_responsavel_id: orgao_id,
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                });

                await prismaTxn.tarefa.update({
                    where: { transferencia_fase_id: andamentoNovaFase.id },
                    data: {
                        inicio_real: new Date(Date.now()),
                        atualizado_em: new Date(Date.now()),
                    },
                });

                for (const tarefa of andamentoNovaFase.tarefas) {
                    await prismaTxn.tarefa.update({
                        where: { id: tarefa.tarefaEspelhada[0].id },
                        data: {
                            inicio_real: new Date(Date.now()),
                            atualizado_em: new Date(Date.now()),
                        },
                    });
                }

                await prismaTxn.transferencia.update({
                    where: { id: dto.transferencia_id },
                    data: {
                        workflow_fase_atual_id: andamentoNovaFase.workflow_fase_id,
                    },
                });

                return { id: andamentoNovaFase.id };
            }
        );

        return updated;
    }

    async reabrirFaseAnterior(dto: WorkflowReabrirFaseAnteriorDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferencia = await prismaTxn.transferencia.findFirstOrThrow({
                    where: { id: dto.transferencia_id },
                    select: {
                        workflow_etapa_atual_id: true,
                        workflow_fase_atual_id: true,
                    },
                });

                if (!transferencia.workflow_etapa_atual_id || !transferencia.workflow_fase_atual_id) {
                    throw new HttpException('Transferência não possui etapa ou fase atual', 400);
                }

                // Encontrando fase atual
                const faseAtual = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        workflow_etapa_id: transferencia.workflow_etapa_atual_id!,
                        workflow_fase_id: transferencia.workflow_fase_atual_id!,
                        removido_em: null,
                    },
                    orderBy: { data_inicio: 'desc' },
                    select: {
                        id: true,
                        data_inicio: true,
                        data_termino: true,
                        workflow_fase_id: true,
                        workflow_etapa_id: true,
                        workflow_fase: {
                            select: {
                                fase: true,
                            },
                        },
                        tarefaEspelhada: {
                            select: { id: true },
                        },
                        tarefas: {
                            select: {
                                id: true,
                                tarefaEspelhada: {
                                    select: { id: true },
                                },
                            },
                        },
                        orgao_responsavel: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },
                        workflow_situacao: {
                            select: {
                                id: true,
                                tipo_situacao: true,
                            },
                        },
                        pessoa_responsavel: {
                            select: {
                                id: true,
                                nome_exibicao: true,
                            },
                        },
                    },
                });
                if (!faseAtual) throw new HttpException('Não foi possível encontrar a fase atual', 400);

                let faseParaReabrir = faseAtual;
                let faseParaFechar = null;

                // Se a fase atual já foi concluída, vamos reabri-la
                if (faseAtual.data_termino) {
                    faseParaReabrir = faseAtual;
                } else {
                    // Se a fase atual não foi concluída, vamos encontrar a fase anterior
                    const faseAnterior = await prismaTxn.transferenciaAndamento.findFirst({
                        where: {
                            transferencia_id: dto.transferencia_id,
                            removido_em: null,
                            data_inicio: { not: null },
                            AND: [{ data_termino: { not: null } }, { data_termino: { lte: faseAtual.data_inicio! } }],
                        },
                        orderBy: [{ data_termino: 'desc' }],
                        select: {
                            id: true,
                            workflow_etapa_id: true,
                            workflow_fase_id: true,
                            data_inicio: true,
                            data_termino: true,
                            workflow_fase: {
                                select: {
                                    fase: true,
                                },
                            },
                            tarefaEspelhada: {
                                select: { id: true },
                            },
                            tarefas: {
                                select: {
                                    id: true,
                                    tarefaEspelhada: {
                                        select: { id: true },
                                    },
                                },
                            },
                            orgao_responsavel: {
                                select: {
                                    id: true,
                                    sigla: true,
                                    descricao: true,
                                },
                            },
                            workflow_situacao: {
                                select: {
                                    id: true,
                                    tipo_situacao: true,
                                },
                            },
                            pessoa_responsavel: {
                                select: {
                                    id: true,
                                    nome_exibicao: true,
                                },
                            },
                        },
                    });
                    if (!faseAnterior) throw new HttpException('Não foi possível encontrar a fase anterior', 400);

                    faseParaReabrir = faseAnterior;
                    faseParaFechar = faseAtual;
                }

                // Reabrindo a fase
                await prismaTxn.transferenciaAndamento.update({
                    where: { id: faseParaReabrir.id },
                    data: {
                        data_termino: null,
                        removido_em: null,
                        removido_por: null,
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                });

                // Atualizando tarefa espelhada da fase reaberta
                await prismaTxn.tarefa.update({
                    where: { id: faseParaReabrir.tarefaEspelhada[0].id },
                    data: {
                        percentual_concluido: 0,
                        termino_real: null,
                        atualizado_em: new Date(Date.now()),
                    },
                });

                // Reabrindo tarefas da fase
                for (const tarefa of faseParaReabrir.tarefas) {
                    await prismaTxn.transferenciaAndamentoTarefa.update({
                        where: { id: tarefa.id },
                        data: {
                            feito: false,
                            atualizado_em: new Date(Date.now()),
                            atualizado_por: user.id,
                        },
                    });

                    await prismaTxn.tarefa.update({
                        where: { id: tarefa.tarefaEspelhada[0].id },
                        data: {
                            percentual_concluido: 0,
                            termino_real: null,
                            atualizado_em: new Date(Date.now()),
                        },
                    });
                }

                // Se houver uma fase para fechar (caso estejamos reabrindo a fase anterior)
                if (faseParaFechar) {
                    await prismaTxn.transferenciaAndamento.update({
                        where: { id: faseParaFechar.id },
                        data: {
                            data_inicio: null,
                            removido_em: null,
                            removido_por: null,
                            atualizado_em: new Date(Date.now()),
                            atualizado_por: user.id,
                        },
                    });

                    await prismaTxn.tarefa.update({
                        where: { id: faseParaFechar.tarefaEspelhada[0].id },
                        data: {
                            inicio_real: null,
                            percentual_concluido: 0,
                            atualizado_em: new Date(Date.now()),
                        },
                    });
                }

                // Atualizando a fase atual na transferência
                await prismaTxn.transferencia.update({
                    where: { id: dto.transferencia_id },
                    data: {
                        workflow_etapa_atual_id: faseParaReabrir.workflow_etapa_id,
                        workflow_fase_atual_id: faseParaReabrir.workflow_fase_id,
                    },
                });

                // Salvando dados de log
                await prismaTxn.transferenciaHistorico.create({
                    data: {
                        transferencia_id: dto.transferencia_id,
                        criado_por: user.id,
                        acao: TransferenciaHistoricoAcao.ReaberturaFaseWorkflow,
                        dados_extra: JSON.stringify({
                            faseReaberta: {
                                id: faseParaReabrir.id,
                                orgao_responsavel: faseParaReabrir.orgao_responsavel,
                                data_inicio: faseParaReabrir.data_inicio,
                                data_termino: faseParaReabrir.data_termino,
                                situacao: faseParaReabrir.workflow_situacao,
                                pessoa_responsavel: faseParaReabrir.pessoa_responsavel,
                                fase: faseParaReabrir.workflow_fase.fase,
                            },
                            faseIncompleta: faseParaFechar
                                ? {
                                      id: faseParaFechar.id,
                                      orgao_responsavel: faseParaFechar.orgao_responsavel,
                                      data_inicio: faseParaFechar.data_inicio,
                                      situacao: faseParaFechar.workflow_situacao,
                                      pessoa_responsavel: faseParaFechar.pessoa_responsavel,
                                      fase: faseParaFechar.workflow_fase.fase,
                                  }
                                : null,
                        }),
                    },
                });

                return { id: faseParaReabrir.id };
            }
        );

        return updated;
    }
}
