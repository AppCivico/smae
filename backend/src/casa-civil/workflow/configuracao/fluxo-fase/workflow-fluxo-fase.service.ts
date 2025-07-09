import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from 'src/generated/prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkflowfluxoFaseDto } from './dto/create-workflow-fluxo-fase.dto';
import { FilterWorkflowfluxoFaseDto } from './dto/filter-workflow-fluxo-fase.dto';
import { UpdateWorkflowfluxoFaseDto } from './dto/update-workflow-fluxo-fase.dto';
import { WorkflowfluxoFaseDto } from './entities/workflow-fluxo-fase.entity';
import { WorkflowService } from '../workflow.service';

@Injectable()
export class WorkflowfluxoFaseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async create(dto: CreateWorkflowfluxoFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Tratando ordem
                let ordem: number;
                if (dto.ordem != undefined) {
                    const ordemEmUso = await prismaTxn.fluxoFase.count({
                        where: {
                            fluxo_id: dto.fluxo_id,
                            ordem: dto.ordem,
                            removido_em: null,
                        },
                    });
                    if (ordemEmUso) throw new HttpException('ordem| Ordem já em uso para este Workflow.', 400);

                    ordem = dto.ordem;
                } else {
                    const ultimaOrdem = await prismaTxn.fluxoFase.findFirst({
                        where: {
                            fluxo_id: dto.fluxo_id,
                            removido_em: null,
                        },
                        select: { ordem: true },
                    });

                    ordem = ultimaOrdem?.ordem ?? 1;
                }

                // Verificando se já tem transferência.
                const fluxo = await prismaTxn.fluxo.findFirst({
                    where: {
                        id: dto.fluxo_id,
                        removido_em: null,
                    },
                    select: {
                        workflow_id: true,
                    },
                });
                if (!fluxo) throw new HttpException('fluxo_id| Fluxo não encontrado', 400);

                const emUso = await prismaTxn.transferencia.count({
                    where: {
                        workflow_id: fluxo.workflow_id,
                        removido_em: null,
                    },
                });
                if (emUso) throw new HttpException('Fase não pode ser criada, pois workflow já está em uso', 400);

                // TODO: tratar fluxoFase circular

                const workflowfluxoFase = await prismaTxn.fluxoFase.create({
                    data: {
                        fluxo_id: dto.fluxo_id,
                        fase_id: dto.fase_id,
                        ordem: ordem,
                        responsabilidade: dto.responsabilidade,
                        marco: dto.marco,
                        duracao: dto.duracao,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        situacoes: {
                            createMany: {
                                data:
                                    dto.situacao != undefined
                                        ? dto.situacao.map((situacaoId) => {
                                              return {
                                                  situacao_id: situacaoId,
                                              };
                                          })
                                        : [],
                            },
                        },
                    },
                    select: { id: true },
                });

                return workflowfluxoFase;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowfluxoFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.fluxoFase.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        fluxo_id: true,
                        fase_id: true,
                        ordem: true,

                        fluxo: {
                            select: {
                                workflow_id: true,
                            },
                        },
                    },
                });
                if (!self) throw new NotFoundException('fluxoFase não encontrado');

                // Caso o Workflow já possua uma transferência ativa, não pode ser editado.
                await this.workflowService.verificaEdicao(self.fluxo.workflow_id, prismaTxn);

                if (dto.fase_id != undefined && dto.fase_id != self.fase_id) {
                    const saidaJaExiste = await prismaTxn.fluxoFase.count({
                        where: {
                            fluxo_id: self.fluxo_id,
                            fase_id: dto.fase_id,
                            removido_em: null,
                        },
                    });
                    if (saidaJaExiste) throw new HttpException('fase_id| Fase já em uso para este fluxo.', 400);
                }

                // Tratando ordem
                let ordem: number | undefined;
                if (dto.ordem != undefined && dto.ordem != self.ordem) {
                    const ordemEmUso = await prismaTxn.fluxoFase.count({
                        where: {
                            fluxo_id: self.fluxo_id,
                            ordem: dto.ordem,
                            removido_em: null,
                        },
                    });
                    if (ordemEmUso) throw new HttpException('ordem| Ordem já em uso para este Workflow.', 400);

                    ordem = dto.ordem;
                }

                if (dto.situacao != undefined) {
                    await this.upsertSituacao(id, dto.situacao, user);
                }

                const workflowfluxoFase = await prismaTxn.fluxoFase.update({
                    where: { id },
                    data: {
                        fase_id: dto.fase_id,
                        ordem: ordem,
                        marco: dto.marco,
                        duracao: dto.duracao,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowfluxoFase;
            }
        );

        return updated;
    }

    async findAll(filters: FilterWorkflowfluxoFaseDto, user: PessoaFromJwt): Promise<WorkflowfluxoFaseDto[]> {
        const rows = await this.prisma.fluxoFase.findMany({
            where: {
                fluxo_id: filters.fluxo_id,
                removido_em: null,
            },
            orderBy: [{ ordem: 'asc' }],
            select: {
                id: true,
                fluxo_id: true,
                ordem: true,
                responsabilidade: true,
                marco: true,
                duracao: true,
                fase: {
                    select: {
                        id: true,
                        fase: true,
                    },
                },

                situacoes: {
                    select: {
                        situacao: {
                            select: {
                                id: true,
                                situacao: true,
                                tipo_situacao: true,
                            },
                        },
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                id: r.id,
                fluxo_id: r.fluxo_id,
                responsabilidade: r.responsabilidade,
                ordem: r.ordem,
                marco: r.marco,
                duracao: r.duracao,
                fase: {
                    id: r.fase.id,
                    fase: r.fase.fase,
                },

                situacao: r.situacoes.map((e) => {
                    return {
                        id: e.situacao.id,
                        situacao: e.situacao.situacao,
                        tipo_situacao: e.situacao.tipo_situacao,
                    };
                }),
            };
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const self = await prismaTxn.fluxoFase.findFirst({
                where: {
                    id,
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
            if (!self) throw new NotFoundException('Fluxo fase não encontrado');

            // Caso o Workflow já possua uma transferência ativa, não pode ser removido.
            await this.workflowService.verificaEdicao(self.fluxo.workflow_id, prismaTxn);

            await this.prisma.fluxoFase.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });
    }

    async upsertSituacao(id: number, situacao: number[], user: PessoaFromJwt) {
        function idsIguais(arr1: number[], arr2: number[]): boolean {
            if (arr1.length !== arr2.length) {
                return false;
            }

            for (let i = 0; i < arr1.length; i++) {
                if (arr1[i] !== arr2[i]) {
                    return false;
                }
            }

            return true;
        }

        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.fluxoFase.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        situacoes: {
                            select: {
                                id: true,
                                situacao_id: true,
                            },
                        },
                    },
                });
                if (!self) throw new NotFoundException('Fase de fluxo não encontrada');

                const paramIds: number[] = situacao.sort((a, b) => a - b);
                const currentIds: number[] = self.situacoes
                    .map((s) => {
                        return s.situacao_id;
                    })
                    .sort((a, b) => a - b);

                if (!idsIguais(paramIds, currentIds)) {
                    await prismaTxn.fluxoFaseSituacao.deleteMany({
                        where: { fluxo_fase_id: id },
                    });

                    await prismaTxn.fluxoFaseSituacao.createMany({
                        data: paramIds.map((situacao_id) => {
                            return {
                                fluxo_fase_id: id,
                                situacao_id: situacao_id,
                            };
                        }),
                    });
                }

                return { id };
            }
        );

        return updated;
    }
}
