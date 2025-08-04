import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from 'src/generated/prisma/client';
import { CreateWorkflowFluxoDto } from './dto/create-workflow-fluxo.dto';
import { UpdateWorkflowFluxoDto } from './dto/update-workflow-fluxo.dto';
import { WorkflowFluxoDto } from './entities/workflow-fluxo.entity';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterWorkflowFluxoDto } from './dto/filter-workflow-fluxo.dto';
import { WorkflowService } from '../workflow.service';

@Injectable()
export class WorkflowFluxoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async create(dto: CreateWorkflowFluxoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                await this.workflowService.verificaEdicao(dto.workflow_id, prismaTxn);

                const saidaJaExiste = await prismaTxn.fluxo.count({
                    where: {
                        workflow_id: dto.workflow_id,
                        fluxo_etapa_de_id: dto.workflow_etapa_de_id,
                        removido_em: null,
                    },
                });
                if (saidaJaExiste)
                    throw new HttpException('workflow_etapa_de_id| Etapa de saída já em uso para este Workflow.', 400);

                const destinoJaExiste = await prismaTxn.fluxo.count({
                    where: {
                        workflow_id: dto.workflow_id,
                        fluxo_etapa_para_id: dto.workflow_etapa_para_id,
                        removido_em: null,
                    },
                });
                if (destinoJaExiste)
                    throw new HttpException(
                        'workflow_etapa_para_id| Etapa de saída já em uso para este Workflow.',
                        400
                    );

                // Tratando ordem
                let ordem: number;
                if (dto.ordem != undefined) {
                    const ordemEmUso = await prismaTxn.fluxo.count({
                        where: {
                            workflow_id: dto.workflow_id,
                            ordem: dto.ordem,
                            removido_em: null,
                        },
                    });
                    if (ordemEmUso) throw new HttpException('ordem| Ordem já em uso para este Workflow.', 400);

                    ordem = dto.ordem;
                } else {
                    const ultimaOrdem = await prismaTxn.fluxo.findFirst({
                        where: {
                            workflow_id: dto.workflow_id,
                            removido_em: null,
                        },
                        select: { ordem: true },
                    });

                    ordem = ultimaOrdem?.ordem ?? 1;
                }

                if (dto.workflow_etapa_de_id == dto.workflow_etapa_para_id)
                    throw new HttpException('Etapa de entrada não pode ser a mesma etapa de saída,', 400);

                // Caso a ordem seja > 1.
                // Deve ser verificado se está correto o "dê". Ou seja, deve ser o "para" do passo anterior.
                const fluxoAnterior = await prismaTxn.fluxo.findFirst({
                    where: {
                        ordem: { lt: ordem },
                        workflow_id: dto.workflow_id,
                        removido_em: null,
                    },
                    orderBy: { ordem: 'desc' },
                    select: {
                        fluxo_etapa_para_id: true,
                    },
                });
                console.log(fluxoAnterior);
                if (fluxoAnterior && dto.workflow_etapa_de_id != fluxoAnterior.fluxo_etapa_para_id)
                    throw new HttpException(
                        'workflow_etapa_de_id| Etapa de entrada deve ser a mesma de saída do passo anterior do fluxo.',
                        400
                    );

                const workflowFluxo = await prismaTxn.fluxo.create({
                    data: {
                        workflow_id: dto.workflow_id,
                        fluxo_etapa_de_id: dto.workflow_etapa_de_id,
                        fluxo_etapa_para_id: dto.workflow_etapa_para_id,
                        ordem: ordem,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowFluxo;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowFluxoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.fluxo.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        workflow_id: true,
                        fluxo_etapa_de_id: true,
                        fluxo_etapa_para_id: true,
                        ordem: true,
                    },
                });
                if (!self) throw new NotFoundException('Fluxo não encontrado');

                // Caso o Workflow já possua uma transferência ativa, não pode ser editado.
                await this.workflowService.verificaEdicao(self.workflow_id, prismaTxn);

                if (dto.workflow_etapa_de_id != undefined && dto.workflow_etapa_de_id != self.fluxo_etapa_de_id) {
                    const saidaJaExiste = await prismaTxn.fluxo.count({
                        where: {
                            workflow_id: self.workflow_id,
                            fluxo_etapa_de_id: dto.workflow_etapa_de_id,
                            removido_em: null,
                        },
                    });
                    if (saidaJaExiste)
                        throw new HttpException(
                            'workflow_etapa_de_id| Etapa de saída já em uso para este Workflow.',
                            400
                        );
                }

                if (dto.workflow_etapa_para_id != undefined && dto.workflow_etapa_para_id != self.fluxo_etapa_para_id) {
                    const destinoJaExiste = await prismaTxn.fluxo.count({
                        where: {
                            workflow_id: self.workflow_id,
                            fluxo_etapa_para_id: dto.workflow_etapa_para_id,
                            removido_em: null,
                        },
                    });
                    if (destinoJaExiste)
                        throw new HttpException(
                            'workflow_etapa_para_id| Etapa de saída já em uso para este Workflow.',
                            400
                        );
                }

                // Tratando ordem
                let ordem: number | undefined;
                if (dto.ordem != undefined && dto.ordem != self.ordem) {
                    const ordemEmUso = await prismaTxn.fluxo.count({
                        where: {
                            workflow_id: self.workflow_id,
                            ordem: dto.ordem,
                            removido_em: null,
                        },
                    });
                    if (ordemEmUso) throw new HttpException('ordem| Ordem já em uso para este Workflow.', 400);

                    ordem = dto.ordem;
                }

                const workflowFluxo = await prismaTxn.fluxo.update({
                    where: { id },
                    data: {
                        fluxo_etapa_de_id: dto.workflow_etapa_de_id,
                        fluxo_etapa_para_id: dto.workflow_etapa_para_id,
                        ordem: ordem,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowFluxo;
            }
        );

        return updated;
    }

    async findAll(filters: FilterWorkflowFluxoDto, user: PessoaFromJwt): Promise<WorkflowFluxoDto[]> {
        const rows = await this.prisma.fluxo.findMany({
            where: {
                workflow_id: filters.workflow_id,
                removido_em: null,
            },
            orderBy: [{ ordem: 'asc' }],
            select: {
                id: true,
                workflow_id: true,
                ordem: true,

                fluxo_etapa_de: {
                    select: {
                        id: true,
                        etapa_fluxo: true,
                    },
                },

                fluxo_etapa_para: {
                    select: {
                        id: true,
                        etapa_fluxo: true,
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                ...r,

                workflow_etapa_de: {
                    id: r.fluxo_etapa_de.id,
                    descricao: r.fluxo_etapa_de.etapa_fluxo,
                },
                workflow_etapa_para: {
                    id: r.fluxo_etapa_para.id,
                    descricao: r.fluxo_etapa_para.etapa_fluxo,
                },
            };
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const self = await prismaTxn.fluxo.findFirst({
                where: {
                    id,
                    removido_em: null,
                },
                select: {
                    workflow_id: true,
                },
            });
            if (!self) throw new NotFoundException('Fluxo não encontrado');

            // Caso o Workflow já possua uma transferência ativa, não pode ser removido.
            await this.workflowService.verificaEdicao(self.workflow_id, prismaTxn);

            await this.prisma.fluxo.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });
    }
}
