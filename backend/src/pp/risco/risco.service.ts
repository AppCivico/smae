import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProjetoStatus, StatusRisco } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { RiscoCalc } from 'src/common/RiscoCalc';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRiscoDto } from './dto/create-risco.dto';
import { UpdateRiscoDto } from './dto/update-risco.dto';
import { ProjetoRisco, ProjetoRiscoDetailDto } from './entities/risco.entity';
import { Date2YMD } from '../../common/date2ymd';

@Injectable()
export class RiscoService {
    private readonly logger = new Logger(RiscoService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(projetoId: number, dto: CreateRiscoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const projetoPortfolio = await this.prisma.projeto.findFirstOrThrow({
            where: { id: projetoId },
            select: {
                portfolio: {
                    select: { modelo_clonagem: true },
                },
            },
        });
        if (projetoPortfolio.portfolio.modelo_clonagem)
            throw new HttpException('Projeto pertence a Portfolio de modelo de clonagem', 400);

        const calcResult =
            dto.probabilidade && dto.impacto ? RiscoCalc.getResult(dto.probabilidade, dto.impacto) : undefined;

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Na criação, o código é fixado, para sempre ir para o final da lista.
                const ultimoCodigoUsado = await prismaTx.projetoRisco.findFirst({
                    where: {
                        projeto_id: projetoId,
                        removido_em: null,
                    },
                    orderBy: { codigo: 'desc' },
                    take: 1,
                    select: {
                        codigo: true,
                    },
                });

                let codigo: number;
                if (!ultimoCodigoUsado) {
                    codigo = 1;
                } else {
                    codigo = ultimoCodigoUsado.codigo + 1;
                }

                const risco = await prismaTx.projetoRisco.create({
                    data: {
                        projeto_id: projetoId,
                        status_risco: StatusRisco.SemInformacao,

                        codigo: codigo,
                        registrado_em: dto.registrado_em,
                        probabilidade: dto.probabilidade,
                        impacto: dto.impacto,
                        descricao: dto.descricao,
                        causa: dto.causa,
                        titulo: dto.titulo,
                        consequencia: dto.consequencia,
                        risco_tarefa_outros: dto.risco_tarefa_outros,

                        nivel: calcResult?.nivel,
                        grau: calcResult?.grau_valor,
                        resposta: calcResult?.resposta_descricao,

                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                if (dto.tarefa_id) {
                    await prismaTx.riscoTarefa.createMany({
                        data: dto.tarefa_id.map((t) => {
                            return {
                                projeto_risco_id: risco.id,
                                tarefa_id: t,
                            };
                        }),
                    });
                }

                return { id: risco.id };
            }
        );

        return created;
    }

    async findAll(projetoId: number, user: PessoaFromJwt | undefined): Promise<ProjetoRisco[]> {
        const projetoRiscoList = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<ProjetoRisco[]> => {
                const projetoRisco = await prismaTx.projetoRisco.findMany({
                    where: {
                        projeto_id: projetoId,
                        removido_em: null,
                    },
                    orderBy: [{ codigo: 'asc' }],
                    select: {
                        id: true,
                        codigo: true,
                        registrado_em: true,
                        descricao: true,
                        causa: true,
                        consequencia: true,
                        probabilidade: true,
                        impacto: true,
                        nivel: true,
                        grau: true,
                        resposta: true,
                        risco_tarefa_outros: true,
                        status_risco: true,
                        titulo: true,
                        planos_de_acao_sem_dt_term: true,
                    },
                });

                const projetoRiscoPromises = projetoRisco.map(async (r) => {
                    let nivel: number | null = null;
                    let grau: number | null = null;
                    let resposta: string | null = null;
                    let calcResult;

                    if (r.probabilidade && r.impacto) calcResult = RiscoCalc.getResult(r.probabilidade, r.impacto);

                    if (r.nivel && r.grau && r.resposta) {
                        nivel = r.nivel;
                        grau = r.grau;
                        resposta = r.resposta;
                    } else {
                        if (calcResult) {
                            nivel = calcResult.nivel;
                            grau = calcResult.grau_valor;
                            resposta = calcResult.resposta_descricao;

                            await prismaTx.projetoRisco.update({
                                where: { id: r.id },
                                data: {
                                    nivel,
                                    grau,
                                    resposta,
                                },
                            });
                        }
                    }

                    return {
                        ...r,
                        impacto_descricao: calcResult?.impacto_descricao ?? null,
                        probabilidade_descricao: calcResult?.probabilidade_descricao ?? null,
                        nivel: nivel,
                        grau: grau,
                        grau_descricao: calcResult?.grau_descricao ?? null,
                        resposta: resposta,
                        resposta_descricao: calcResult?.resposta_descricao ?? null,
                    };
                });

                return Promise.all(projetoRiscoPromises);
            }
        );

        return projetoRiscoList;
    }

    async findOne(projetoId: number, riscoId: number, user: PessoaFromJwt): Promise<ProjetoRiscoDetailDto> {
        const projetoRisco = await this.prisma.projetoRisco.findFirst({
            where: {
                projeto_id: projetoId,
                id: riscoId,
                removido_em: null,
            },
            select: {
                id: true,
                codigo: true,
                registrado_em: true,
                descricao: true,
                causa: true,
                consequencia: true,
                probabilidade: true,
                impacto: true,
                nivel: true,
                grau: true,
                resposta: true,
                titulo: true,
                risco_tarefa_outros: true,
                status_risco: true,
                planos_de_acao_sem_dt_term: true,
                RiscoTarefa: {
                    select: {
                        tarefa: {
                            select: {
                                id: true,
                                tarefa: true,
                            },
                        },
                    },
                },

                planos_de_acao: {
                    select: {
                        id: true,
                        contramedida: true,
                        prazo_contramedida: true,
                        custo: true,
                        custo_percentual: true,
                        medidas_de_contingencia: true,
                        responsavel: true,
                        contato_do_responsavel: true,
                        data_termino: true,

                        orgao: {
                            select: {
                                id: true,
                                sigla: true,
                            },
                        },

                        projeto_risco: {
                            select: {
                                id: true,
                                codigo: true,
                            },
                        },
                    },
                    where: {
                        removido_em: null,
                    },
                    orderBy: [{ data_termino: 'asc' }],
                },

                projeto: {
                    select: {
                        status: true,
                    },
                },
            },
        });
        if (!projetoRisco) throw new HttpException('Não foi possível encontrar o Risco', 400);

        let calcResult;
        if (projetoRisco.probabilidade && projetoRisco.impacto)
            calcResult = RiscoCalc.getResult(projetoRisco.probabilidade, projetoRisco.impacto);

        // Flag para informar se o código pode ser atualizado.
        const valoresStatusAceitaveis: ProjetoStatus[] = [
            ProjetoStatus.Registrado,
            ProjetoStatus.Selecionado,
            ProjetoStatus.EmPlanejamento,
        ];
        const edicaoLimitada: boolean = !valoresStatusAceitaveis.includes(projetoRisco.projeto.status);

        return {
            ...projetoRisco,
            impacto_descricao: calcResult ? calcResult.impacto_descricao : null,
            probabilidade_descricao: calcResult ? calcResult.probabilidade_descricao : null,
            nivel: calcResult ? calcResult.nivel : null,
            grau: calcResult ? calcResult.grau_valor : null,
            grau_descricao: calcResult ? calcResult.grau_descricao : null,
            resposta: calcResult ? calcResult.resposta_descricao : null,
            edicao_limitada: edicaoLimitada,

            tarefas_afetadas: projetoRisco?.RiscoTarefa.map((r) => {
                return {
                    tarefa_id: r.tarefa.id,
                    tarefa: r.tarefa.tarefa,
                };
            }),

            planos_de_acao: projetoRisco.planos_de_acao.map((pa) => {
                return {
                    ...pa,
                    prazo_contramedida: Date2YMD.toStringOrNull(pa.prazo_contramedida),
                    data_termino: Date2YMD.toStringOrNull(pa.data_termino),
                };
            }),
        };
    }

    async update(projeto_risco_id: number, dto: UpdateRiscoDto, user: PessoaFromJwt) {
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTx.projetoRisco.findFirstOrThrow({
                    where: { id: projeto_risco_id },
                    select: { codigo: true },
                });

                if (dto.tarefa_id) {
                    const tarefa_id = dto.tarefa_id;
                    delete dto.tarefa_id;

                    await prismaTx.riscoTarefa.deleteMany({ where: { projeto_risco_id: projeto_risco_id } });
                    await prismaTx.riscoTarefa.createMany({
                        data: tarefa_id.map((r) => {
                            return {
                                projeto_risco_id: projeto_risco_id,
                                tarefa_id: r,
                            };
                        }),
                    });
                }

                if (dto.codigo && dto.codigo != self.codigo) {
                    // O código só pode ser modificado caso o status do Projeto for diferente de ['Planejado','Validado ','EmAcompanhamento','Suspenso','Fechado ']
                    const valoresAceitaveis: ProjetoStatus[] = [
                        ProjetoStatus.Registrado,
                        ProjetoStatus.Selecionado,
                        ProjetoStatus.EmPlanejamento,
                    ];

                    const projetoRisco = await prismaTx.projetoRisco.findFirst({
                        where: { id: projeto_risco_id },
                        select: {
                            projeto: {
                                select: {
                                    id: true,
                                    status: true,
                                },
                            },
                        },
                    });
                    if (!projetoRisco) throw new Error('Erro interno ao buscar dados do Projeto Prioritário.');

                    const projetoStatus: ProjetoStatus = projetoRisco.projeto.status;

                    if (valoresAceitaveis.includes(projetoStatus)) {
                        const riscosAbaixo = await prismaTx.projetoRisco.findMany({
                            where: {
                                id: { not: projeto_risco_id },
                                projeto_id: projetoRisco.projeto.id,
                                removido_em: null,
                                codigo: {
                                    gte: dto.codigo,
                                    // Valor padrão do "final da fila"
                                    lte: 9999,
                                },
                            },
                            orderBy: { codigo: 'asc' },
                            select: {
                                id: true,
                                codigo: true,
                            },
                        });

                        const updates = [];
                        let primeiraRow = true;
                        for (const row of riscosAbaixo) {
                            if (primeiraRow && row.codigo != dto.codigo) break;

                            updates.push(
                                prismaTx.projetoRisco.update({
                                    where: { id: row.id },
                                    data: { codigo: row.codigo + 1 },
                                })
                            );

                            primeiraRow = false;
                        }

                        await Promise.all(updates);
                    } else {
                        throw new HttpException('Status do Projeto não permite alteração no código', 400);
                    }
                }

                const calcResult =
                    dto.probabilidade && dto.impacto ? RiscoCalc.getResult(dto.probabilidade, dto.impacto) : undefined;

                return await prismaTx.projetoRisco.update({
                    where: { id: projeto_risco_id },
                    data: {
                        codigo: dto.codigo,
                        registrado_em: dto.registrado_em,
                        probabilidade: dto.probabilidade,
                        impacto: dto.impacto,
                        descricao: dto.descricao,
                        causa: dto.causa,
                        titulo: dto.titulo,
                        consequencia: dto.consequencia,
                        risco_tarefa_outros: dto.risco_tarefa_outros,
                        status_risco: dto.status,

                        nivel: calcResult?.nivel,
                        grau: calcResult?.grau_valor,
                        resposta: calcResult?.resposta_descricao,

                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });
            },
            {
                maxWait: 15000,
                timeout: 60000,
            }
        );

        return updated;
    }

    async remove(projeto_id: number, projeto_risco_id: number, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.projetoRisco.findFirstOrThrow({
                where: {
                    id: projeto_risco_id,
                    projeto_id: projeto_id,
                },
                select: {
                    projeto: {
                        select: { status: true },
                    },
                },
            });

            return await this.prisma.projetoRisco.updateMany({
                where: {
                    id: projeto_risco_id,
                    projeto_id: projeto_id,
                },
                data: {
                    removido_em: new Date(Date.now()),
                    removido_por: user.id,
                },
            });
        });
    }
}
