import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { DateTime } from 'luxon';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { FilterWorkflowDto } from './dto/filter-workflow.dto';
import { WorkflowDetailDto, WorkflowDto } from './entities/workflow.entity';

@Injectable()
export class WorkflowService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateWorkflowDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferenciaTipoExiste = await prismaTxn.transferenciaTipo.count({
                    where: {
                        id: dto.transferencia_tipo_id,
                        removido_em: null,
                    },
                });
                if (!transferenciaTipoExiste)
                    throw new HttpException('transferencia_tipo_id| Tipo de transferência não existe.', 400);

                const similarExists = await prismaTxn.workflow.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                // Tratando boolean de ativo.
                let ativo: boolean = false;
                const now = DateTime.now().startOf('day');

                // Se o início for =< now, ele é elegível para ser o ativo, mas deve ser verificado.
                if (DateTime.fromJSDate(dto.inicio) <= now) {
                    // Verificando se já existe um ativo.
                    const workflowAtivo = await prismaTxn.workflow.count({
                        where: {
                            ativo: true,
                            inicio: { lte: now.toJSDate() },
                            removido_em: null,
                            OR: [{ termino: { gt: now.toJSDate() } }, { termino: null }],
                        },
                    });

                    ativo = !workflowAtivo ?? true;
                }

                const workflow = await prismaTxn.workflow.create({
                    data: {
                        nome: dto.nome,
                        transferencia_tipo_id: dto.transferencia_tipo_id,
                        ativo: ativo,
                        inicio: dto.inicio,
                        termino: dto.termino,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflow;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await this.prisma.workflow.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        ativo: true,
                        inicio: true,
                        termino: true,
                        transferencia_tipo_id: true,
                    },
                });
                if (!self) throw new NotFoundException('Workflow não encontrado');

                if (dto.ativo != undefined && dto.ativo != self.ativo && dto.ativo == true) {
                    // Verificando se já não existe workflow ativo.
                    // É necessário verificar se está mudando o início e término ao mesmo tempo
                    // if (dto.inicio != undefined && DateTime.fromJSDate(dto.inicio) != DateTime.fromJSDate(self.inicio) )
                }

                // TODO se alguma transferencia já estiver usando o workflow.
                // Bloquear o edit.

                const workflow = await prismaTxn.workflow.update({
                    where: { id },
                    data: {
                        ativo: dto.ativo,
                        inicio: dto.inicio,
                        termino: dto.termino,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflow;
            }
        );

        return updated;
    }

    async findAll(filters: FilterWorkflowDto, user: PessoaFromJwt): Promise<WorkflowDto[]> {
        const rows = await this.prisma.workflow.findMany({
            where: {
                ativo: filters.ativo,
                transferencia_tipo_id: filters.transferencia_tipo_id,
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                ativo: true,
                inicio: true,
                termino: true,
                transferencia_tipo: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });

        return rows;
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<WorkflowDetailDto> {
        const row = await this.prisma.workflow.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                ativo: true,
                inicio: true,
                termino: true,

                transferencia_tipo: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },

                etapasFluxo: {
                    where: { removido_em: null },
                    orderBy: { ordem: 'asc' },
                    take: 1, // TODO: verificar possibilidade de N fluxos por workflow.
                    select: {
                        id: true,
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

                        fases: {
                            where: { removido_em: null },
                            orderBy: { ordem: 'asc' },
                            select: {
                                id: true,
                                responsabilidade: true,
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

                                tarefas: {
                                    where: { removido_em: null },
                                    orderBy: { ordem: 'asc' },
                                    select: {
                                        id: true,
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
                },
            },
        });
        if (!row) throw new NotFoundException('Workflow não encontrado');

        const fluxo = row.etapasFluxo[0];

        return {
            ...row,

            fluxo: fluxo
                ? {
                      ...fluxo,
                      workflow_etapa_de: {
                          id: fluxo.fluxo_etapa_de.id,
                          descricao: fluxo.fluxo_etapa_de.etapa_fluxo,
                      },

                      workflow_etapa_para: {
                          id: fluxo.fluxo_etapa_para.id,
                          descricao: fluxo.fluxo_etapa_para.etapa_fluxo,
                      },

                      fases: fluxo.fases.map((fase) => {
                          return {
                              ...fase,

                              situacoes: fase.situacoes.map((situacaoRel) => {
                                  return {
                                      id: situacaoRel.situacao.id,
                                      situacao: situacaoRel.situacao.situacao,
                                      tipo_situacao: situacaoRel.situacao.tipo_situacao,
                                  };
                              }),

                              tarefas: fase.tarefas.map((tarefa) => {
                                  return {
                                      ...tarefa,
                                      workflow_tarefa: {
                                          id: tarefa.workflow_tarefa.id,
                                          descricao: tarefa.workflow_tarefa.tarefa_fluxo,
                                      },
                                  };
                              }),
                          };
                      }),
                  }
                : null,
        };
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.workflow.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
