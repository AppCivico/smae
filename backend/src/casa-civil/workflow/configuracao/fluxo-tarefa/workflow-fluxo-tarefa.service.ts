import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from 'src/generated/prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkflowFluxoTarefaDto } from './dto/create-workflow-fluxo-tarefa.dto';
import { UpdateWorkflowFluxoTarefaDto } from './dto/update-workflow-fluxo-tarefa.dto';
import { WorkflowFluxoTarefaDto } from './entities/workflow-fluxo-tarefa.entity';
import { WorkflowService } from '../workflow.service';

@Injectable()
export class WorkflowFluxoTarefaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async create(dto: CreateWorkflowFluxoTarefaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Verificando se já tem transferência.
                const fluxoFase = await prismaTxn.fluxoFase.findFirst({
                    where: {
                        id: dto.fluxo_fase_id,
                        removido_em: null,
                    },
                    select: {
                        fluxo: {
                            select: {
                                workflow_id: true,
                            },
                        },
                    },
                });
                if (!fluxoFase) throw new HttpException('fluxo_fase_id| Fluxo fase não encontrado', 400);

                await this.workflowService.verificaEdicao(fluxoFase.fluxo.workflow_id, prismaTxn);

                const jaExiste = await prismaTxn.fluxoTarefa.count({
                    where: {
                        workflow_tarefa_id: dto.workflow_tarefa_id,
                        fluxo_fase_id: dto.fluxo_fase_id,
                        removido_em: null,
                    },
                });
                if (jaExiste)
                    throw new HttpException('fluxo_fase_id| Já existe uma configuração com estes parâmetros.', 400);

                // Tratando ordem para garantir que não haja lacunas
                let ordem: number;
                if (dto.ordem != undefined) {
                    // Se uma ordem foi especificada, abre espaço para o novo item.
                    await prismaTxn.fluxoTarefa.updateMany({
                        where: {
                            fluxo_fase_id: dto.fluxo_fase_id,
                            ordem: { gte: dto.ordem },
                            removido_em: null,
                        },
                        data: {
                            ordem: {
                                increment: 1,
                            },
                        },
                    });
                    ordem = dto.ordem;
                } else {
                    // Se nenhuma ordem foi especificada, adiciona no final da lista.
                    const maxOrdem = await prismaTxn.fluxoTarefa.aggregate({
                        _max: {
                            ordem: true,
                        },
                        where: {
                            fluxo_fase_id: dto.fluxo_fase_id,
                            removido_em: null,
                        },
                    });
                    ordem = (maxOrdem._max.ordem ?? 0) + 1;
                }

                const workflowFluxoTarefa = await prismaTxn.fluxoTarefa.create({
                    data: {
                        workflow_tarefa_id: dto.workflow_tarefa_id,
                        fluxo_fase_id: dto.fluxo_fase_id,
                        ordem: ordem,
                        marco: dto.marco,
                        duracao: dto.duracao,
                        responsabilidade: dto.responsabilidade,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowFluxoTarefa;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowFluxoTarefaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.fluxoTarefa.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        workflow_tarefa_id: true,
                        fluxo_fase_id: true,
                        ordem: true,
                        fluxo_fase: {
                            select: {
                                fluxo: {
                                    select: {
                                        workflow_id: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (!self) throw new NotFoundException('Fluxo Tarefa não encontrado');

                // Caso o Workflow já possua uma transferência ativa, não pode ser editado.
                await this.workflowService.verificaEdicao(self.fluxo_fase.fluxo.workflow_id, prismaTxn);

                // Tratando ordem para reordenar as outras tarefas se necessário
                if (dto.ordem != undefined && dto.ordem != self.ordem) {
                    const oldOrdem = self.ordem;
                    const newOrdem = dto.ordem;

                    if (newOrdem > oldOrdem) {
                        // Movendo para baixo na lista
                        await prismaTxn.fluxoTarefa.updateMany({
                            where: {
                                fluxo_fase_id: self.fluxo_fase_id,
                                removido_em: null,
                                ordem: {
                                    gt: oldOrdem,
                                    lte: newOrdem,
                                },
                            },
                            data: {
                                ordem: {
                                    decrement: 1,
                                },
                            },
                        });
                    } else {
                        // Movendo para cima na lista
                        await prismaTxn.fluxoTarefa.updateMany({
                            where: {
                                fluxo_fase_id: self.fluxo_fase_id,
                                removido_em: null,
                                ordem: {
                                    gte: newOrdem,
                                    lt: oldOrdem,
                                },
                            },
                            data: {
                                ordem: {
                                    increment: 1,
                                },
                            },
                        });
                    }
                }

                const workflowFluxoTarefa = await prismaTxn.fluxoTarefa.update({
                    where: { id },
                    data: {
                        workflow_tarefa_id: dto.workflow_tarefa_id,
                        ordem: dto.ordem,
                        marco: dto.marco,
                        duracao: dto.duracao,
                        responsabilidade: dto.responsabilidade,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowFluxoTarefa;
            }
        );

        return updated;
    }

    async findAll(user: PessoaFromJwt): Promise<WorkflowFluxoTarefaDto[]> {
        const rows = await this.prisma.fluxoTarefa.findMany({
            where: {
                removido_em: null,
            },
            orderBy: [{ ordem: 'asc' }],
            select: {
                id: true,
                fluxo_fase_id: true,
                ordem: true,
                responsabilidade: true,
                marco: true,
                duracao: true,
                workflow_tarefa: {
                    select: {
                        id: true,
                        tarefa_fluxo: true,
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                id: r.id,
                fluxo_fase_id: r.fluxo_fase_id,
                ordem: r.ordem,
                responsabilidade: r.responsabilidade,
                marco: r.marco,
                duracao: r.duracao,
                workflow_tarefa: {
                    id: r.workflow_tarefa.id,
                    descricao: r.workflow_tarefa.tarefa_fluxo,
                },
            };
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const self = await prismaTxn.fluxoTarefa.findFirst({
                where: {
                    id,
                    removido_em: null,
                },
                select: {
                    ordem: true,
                    fluxo_fase_id: true,
                    fluxo_fase: {
                        select: {
                            fluxo: {
                                select: {
                                    workflow_id: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!self) throw new NotFoundException('Fluxo fase tarefa não encontrado');

            // Caso o Workflow já possua uma transferência ativa, não pode ser removido.
            await this.workflowService.verificaEdicao(self.fluxo_fase.fluxo.workflow_id, prismaTxn);

            // Realiza o soft-delete da tarefa
            await prismaTxn.fluxoTarefa.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });

            // Reordena as tarefas subsequentes para preencher a lacuna
            await prismaTxn.fluxoTarefa.updateMany({
                where: {
                    fluxo_fase_id: self.fluxo_fase_id,
                    ordem: { gt: self.ordem },
                    removido_em: null,
                },
                data: {
                    ordem: {
                        decrement: 1,
                    },
                },
            });
        });
    }
}
