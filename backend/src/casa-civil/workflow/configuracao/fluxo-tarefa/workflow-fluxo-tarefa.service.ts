import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from '@prisma/client';
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

                const emUso = await prismaTxn.transferencia.count({
                    where: {
                        workflow_id: fluxoFase.fluxo.workflow_id,
                        removido_em: null,
                    },
                });
                if (emUso) throw new HttpException('Tarefa não pode ser criada, pois workflow já está em uso', 400);

                const jaExiste = await prismaTxn.fluxoTarefa.count({
                    where: {
                        workflow_tarefa_id: dto.workflow_tarefa_id,
                        fluxo_fase_id: dto.fluxo_fase_id,
                        removido_em: null,
                    },
                });
                if (jaExiste)
                    throw new HttpException('fluxo_fase_id| Já existe uma configuração com estes parâmetros.', 400);

                // Tratando ordem
                let ordem: number;
                if (dto.ordem != undefined) {
                    const ordemEmUso = await prismaTxn.fluxoTarefa.count({
                        where: {
                            fluxo_fase_id: dto.fluxo_fase_id,
                            ordem: dto.ordem,
                            removido_em: null,
                        },
                    });
                    if (ordemEmUso) throw new HttpException('ordem| Ordem já em uso para este para este Fluxo.', 400);

                    ordem = dto.ordem;
                } else {
                    const ultimaOrdem = await prismaTxn.fluxoTarefa.findFirst({
                        where: {
                            workflow_tarefa_id: dto.workflow_tarefa_id,
                            removido_em: null,
                        },
                        select: { ordem: true },
                    });

                    ordem = ultimaOrdem?.ordem ?? 1;
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

                // Tratando ordem
                let ordem: number | undefined;
                if (dto.ordem != undefined && dto.ordem != self.ordem) {
                    const ordemEmUso = await prismaTxn.fluxoTarefa.count({
                        where: {
                            workflow_tarefa_id: self.workflow_tarefa_id,
                            ordem: dto.ordem,
                            removido_em: null,
                        },
                    });
                    if (ordemEmUso) throw new HttpException('ordem| Ordem já em uso para este Workflow.', 400);

                    ordem = dto.ordem;
                }

                const workflowFluxoTarefa = await prismaTxn.fluxoTarefa.update({
                    where: { id },
                    data: {
                        workflow_tarefa_id: dto.workflow_tarefa_id,
                        ordem: ordem,
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
                ...r,

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

            await this.prisma.fluxoTarefa.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });
    }
}
