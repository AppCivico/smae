import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProjetoAcompanhamentoItem, TipoProjeto } from 'src/generated/prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';

import { HtmlSanitizer } from '../../common/html-sanitizer';
import { CreateProjetoAcompanhamentoDto } from './dto/create-acompanhamento.dto';
import { UpdateProjetoAcompanhamentoDto } from './dto/update-acompanhamento.dto';
import {
    DetailProjetoAcompanhamentoDto,
    ProjetoAcompanhamento,
    ProjetoAcompanhamentoRowDto,
} from './entities/acompanhamento.entity';
import { Date2YMD } from '../../common/date2ymd';

@Injectable()
export class AcompanhamentoService {
    private readonly logger = new Logger(AcompanhamentoService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(
        tipo: TipoProjeto,
        projeto_id: number,
        dto: CreateProjetoAcompanhamentoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        //if (!dto.risco_tarefa_outros && Array.isArray(dto.risco) == false || (Array.isArray(dto.risco) && dto.risco.length == 0))
        //throw new HttpException('Se não for enviado um risco do sistema, é necessário informar um risco externo', 400);

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const projetoPortfolio = await prismaTx.projeto.findFirstOrThrow({
                    where: {
                        id: projeto_id,
                        tipo: tipo,
                    },
                    select: {
                        portfolio: {
                            select: { modelo_clonagem: true },
                        },
                        tipo: true,
                    },
                });
                if (projetoPortfolio.portfolio.modelo_clonagem)
                    throw new HttpException('Projeto pertence a Portfolio de modelo de clonagem', 400);

                if (projetoPortfolio.tipo != 'PP' && dto.risco && dto.risco.length > 0)
                    throw new HttpException('Apenas Gestão de Projetos podem ter riscos', 400);

                dto.detalhamento = HtmlSanitizer(dto.detalhamento);

                // Definindo a ordem do acompanhamento.
                // A ordem leva em consideração acompanhamentos removidos.
                const rowAnterior = await prismaTx.projetoAcompanhamento.findFirst({
                    where: { projeto_id: projeto_id },
                    select: { ordem: true },
                    orderBy: { ordem: 'desc' },
                });
                const ordemAcompanhamento: number = rowAnterior ? rowAnterior.ordem + 1 : 1;

                const acompanhamento = await prismaTx.projetoAcompanhamento.create({
                    data: {
                        projeto_id: projeto_id,
                        acompanhanmento_tipo_id: dto.acompanhamento_tipo_id,
                        ordem: ordemAcompanhamento,
                        pauta: dto.pauta,
                        data_registro: dto.data_registro,
                        participantes: dto.participantes,
                        detalhamento: dto.detalhamento,
                        observacao: dto.observacao,
                        detalhamento_status: dto.detalhamento_status,
                        pontos_atencao: dto.pontos_atencao,
                        cronograma_paralisado: dto.cronograma_paralisado,
                        apresentar_no_relatorio: dto.apresentar_no_relatorio,

                        criado_em: now,
                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                if (dto.apresentar_no_relatorio) {
                    await prismaTx.projetoAcompanhamento.updateMany({
                        where: {
                            id: { not: acompanhamento.id },
                            projeto_id: projeto_id,
                            removido_em: null,
                        },
                        data: { apresentar_no_relatorio: false },
                    });
                }

                if (Array.isArray(dto.risco) && dto.risco.length) {
                    await prismaTx.projetoAcompanhamentoRisco.createMany({
                        data: dto.risco.map((r) => {
                            return {
                                projeto_acompanhamento_id: acompanhamento.id,
                                projeto_risco_id: r,
                            };
                        }),
                    });
                }

                if (Array.isArray(dto.acompanhamentos) && dto.acompanhamentos.length) {
                    await prismaTx.projetoAcompanhamentoItem.createMany({
                        data: dto.acompanhamentos.map((r, i) => {
                            const ordemEncaminhamento: number = i + 1;
                            const numeroIdentificador: string = ordemAcompanhamento + '.' + ordemEncaminhamento;

                            return {
                                encaminhamento: r.encaminhamento,
                                prazo_encaminhamento: r.prazo_encaminhamento,
                                prazo_realizado: r.prazo_realizado,
                                responsavel: r.responsavel,
                                projeto_acompanhamento_id: acompanhamento.id,
                                ordem: ordemEncaminhamento,
                                numero_identificador: numeroIdentificador,
                            };
                        }),
                    });
                }

                await this.atualizaProjeto(prismaTx, projeto_id, now);

                return { id: acompanhamento.id };
            },
            {
                isolationLevel: 'Serializable',
            }
        );

        return { id: created.id };
    }

    async findAll(
        tipo: TipoProjeto,
        projeto_id: number,
        user: PessoaFromJwt | undefined
    ): Promise<ProjetoAcompanhamento[]> {
        const projetoAcompanhamento = await this.prisma.projetoAcompanhamento.findMany({
            where: {
                projeto_id: projeto_id,
                projeto: { tipo: tipo, id: projeto_id },
                removido_em: null,
            },
            orderBy: [{ ordem: 'desc' }],
            select: {
                id: true,
                data_registro: true,
                participantes: true,
                observacao: true,
                detalhamento: true,
                detalhamento_status: true,
                pontos_atencao: true,
                pauta: true,
                ordem: true,
                cronograma_paralisado: true,
                criado_em: true,
                atualizado_em: true,
                apresentar_no_relatorio: true,

                acompanhamento_tipo: {
                    select: { id: true, nome: true },
                },

                ProjetoAcompanhamentoItem: {
                    where: { removido_em: null },
                    orderBy: { ordem: 'asc' },
                },

                ProjetoAcompanhamentoRisco: {
                    select: {
                        projeto_risco: {
                            select: {
                                id: true,
                                codigo: true,
                            },
                        },
                    },
                },
            },
        });

        return projetoAcompanhamento.map((r) => {
            return {
                id: r.id,
                data_registro: Date2YMD.toString(r.data_registro),
                participantes: r.participantes,
                detalhamento: r.detalhamento,
                criado_em: r.criado_em,
                atualizado_em: r.atualizado_em,
                pauta: r.pauta,
                ordem: r.ordem,
                observacao: r.observacao,
                pontos_atencao: r.pontos_atencao,
                detalhamento_status: r.detalhamento_status,
                cronograma_paralisado: r.cronograma_paralisado,
                acompanhamento_tipo: r.acompanhamento_tipo
                    ? {
                          id: r.acompanhamento_tipo.id,
                          nome: r.acompanhamento_tipo.nome,
                      }
                    : null,
                apresentar_no_relatorio: r.apresentar_no_relatorio == null ? true : r.apresentar_no_relatorio,
                acompanhamentos: r.ProjetoAcompanhamentoItem.map(this.renderAcompanhamento),

                risco: r.ProjetoAcompanhamentoRisco.map((r) => {
                    return {
                        id: r.projeto_risco.id,
                        codigo: r.projeto_risco.codigo,
                    };
                }),
            };
        });
    }

    renderAcompanhamento(r: ProjetoAcompanhamentoItem): ProjetoAcompanhamentoRowDto {
        return {
            id: r.id,
            encaminhamento: r.encaminhamento,
            prazo_encaminhamento: Date2YMD.toStringOrNull(r.prazo_encaminhamento),
            prazo_realizado: Date2YMD.toStringOrNull(r.prazo_realizado),
            responsavel: r.responsavel,
            ordem: r.ordem,
            numero_identificador: r.numero_identificador,
        };
    }

    async findOne(
        tipo: TipoProjeto,
        projeto_id: number,
        id: number,
        user: PessoaFromJwt
    ): Promise<DetailProjetoAcompanhamentoDto> {
        const projetoAcompanhamento = await this.prisma.projetoAcompanhamento.findFirst({
            where: {
                id,
                projeto_id: projeto_id,
                projeto: { tipo: tipo, id: projeto_id },
                removido_em: null,
            },
            select: {
                id: true,
                data_registro: true,
                participantes: true,
                detalhamento: true,
                ordem: true,

                observacao: true,
                detalhamento_status: true,
                pontos_atencao: true,
                pauta: true,
                apresentar_no_relatorio: true,

                cronograma_paralisado: true,

                acompanhamento_tipo: {
                    select: { id: true, nome: true },
                },

                ProjetoAcompanhamentoItem: {
                    where: { removido_em: null },
                    orderBy: { ordem: 'asc' },
                },

                ProjetoAcompanhamentoRisco: {
                    select: {
                        projeto_risco: {
                            select: {
                                id: true,
                                codigo: true,
                            },
                        },
                    },
                },
            },
        });
        if (!projetoAcompanhamento) throw new HttpException('Não foi possível encontrar o Acompanhamento', 400);

        return {
            id: projetoAcompanhamento.id,
            data_registro: Date2YMD.toString(projetoAcompanhamento.data_registro),
            participantes: projetoAcompanhamento.participantes,

            detalhamento: projetoAcompanhamento.detalhamento,
            pauta: projetoAcompanhamento.pauta,
            ordem: projetoAcompanhamento.ordem,
            apresentar_no_relatorio:
                projetoAcompanhamento.apresentar_no_relatorio == null
                    ? true
                    : projetoAcompanhamento.apresentar_no_relatorio,

            observacao: projetoAcompanhamento.observacao,
            detalhamento_status: projetoAcompanhamento.detalhamento_status,
            pontos_atencao: projetoAcompanhamento.pontos_atencao,

            cronograma_paralisado: projetoAcompanhamento.cronograma_paralisado,

            acompanhamentos: projetoAcompanhamento.ProjetoAcompanhamentoItem.map(this.renderAcompanhamento),

            acompanhamento_tipo: projetoAcompanhamento.acompanhamento_tipo
                ? {
                      id: projetoAcompanhamento.acompanhamento_tipo.id,
                      nome: projetoAcompanhamento.acompanhamento_tipo.nome,
                  }
                : null,

            risco: projetoAcompanhamento.ProjetoAcompanhamentoRisco.map((r) => {
                return {
                    id: r.projeto_risco.id,
                    codigo: r.projeto_risco.codigo,
                };
            }),
        };
    }

    async update(
        tipo: TipoProjeto,
        projeto_id: number,
        id: number,
        dto: UpdateProjetoAcompanhamentoDto,
        user: PessoaFromJwt
    ) {
        const self = await this.prisma.projetoAcompanhamento.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
                projeto_id: projeto_id,
                projeto: { tipo: tipo, id: projeto_id },
            },
            select: {
                id: true,
                ordem: true,
                projeto: { select: { tipo: true } },
                ProjetoAcompanhamentoItem: {
                    orderBy: { ordem: 'desc' },
                    select: {
                        id: true,
                        ordem: true,
                        encaminhamento: true,
                        responsavel: true,
                        prazo_encaminhamento: true,
                        prazo_realizado: true,
                        removido_em: true,
                    },
                },
            },
        });
        if (self.projeto.tipo != 'PP' && dto.risco && dto.risco.length > 0)
            throw new HttpException('Apenas Gestão de Projetos podem ter riscos', 400);

        dto.detalhamento = HtmlSanitizer(dto.detalhamento);

        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());
                if (dto.risco !== undefined) {
                    await prismaTx.projetoAcompanhamentoRisco.deleteMany({
                        where: { projeto_acompanhamento_id: self.id },
                    });

                    if (Array.isArray(dto.risco) && dto.risco.length > 0)
                        await prismaTx.projetoAcompanhamentoRisco.createMany({
                            data: dto.risco.map((r) => {
                                return {
                                    projeto_acompanhamento_id: self.id,
                                    projeto_risco_id: r,
                                };
                            }),
                        });
                }

                if (
                    dto.acompanhamentos !== undefined &&
                    Array.isArray(dto.acompanhamentos) &&
                    dto.acompanhamentos.length
                ) {
                    const encaminhamentosRemovidosId: number[] = self.ProjetoAcompanhamentoItem.filter(
                        (e) => !e.removido_em
                    )
                        .filter((a) => {
                            return !dto.acompanhamentos?.map((x) => x.id).includes(a.id);
                        })
                        .map((a) => a.id);
                    await prismaTx.projetoAcompanhamentoItem.updateMany({
                        where: { id: { in: encaminhamentosRemovidosId } },
                        data: {
                            removido_em: new Date(Date.now()),
                            removido_por: user.id,
                        },
                    });

                    let ordemEncaminhamento: number | null = null;
                    await prismaTx.projetoAcompanhamentoItem.createMany({
                        data: dto.acompanhamentos
                            .filter((e) => e.id == undefined)
                            .map((r) => {
                                if (ordemEncaminhamento) {
                                    ordemEncaminhamento = ordemEncaminhamento + 1;
                                } else if (self.ProjetoAcompanhamentoItem[0]) {
                                    ordemEncaminhamento = self.ProjetoAcompanhamentoItem[0].ordem + 1;
                                } else {
                                    // Primeira row.
                                    ordemEncaminhamento = 1;
                                }

                                const numeroIdentificador: string = self.ordem + '.' + ordemEncaminhamento;

                                return {
                                    encaminhamento: r.encaminhamento,
                                    prazo_encaminhamento: r.prazo_encaminhamento,
                                    prazo_realizado: r.prazo_realizado,
                                    responsavel: r.responsavel,
                                    projeto_acompanhamento_id: self.id,
                                    ordem: ordemEncaminhamento,
                                    numero_identificador: numeroIdentificador,
                                    criado_em: new Date(Date.now()),
                                    criado_por: user.id,
                                };
                            }),
                    });

                    const encaminhamentosAtualizados = dto.acompanhamentos.filter((e) => {
                        const encaminhamentoExistente = self.ProjetoAcompanhamentoItem.find((ee) => ee.id == e.id);
                        if (
                            encaminhamentoExistente &&
                            (e.encaminhamento != encaminhamentoExistente.encaminhamento ||
                                e.responsavel != encaminhamentoExistente.responsavel ||
                                e.prazo_encaminhamento != encaminhamentoExistente.prazo_encaminhamento ||
                                e.prazo_realizado != encaminhamentoExistente.prazo_realizado)
                        ) {
                            return true;
                        } else {
                            return false;
                        }
                    });

                    for (const encaminhamentoAtualizado of encaminhamentosAtualizados) {
                        await prismaTx.projetoAcompanhamentoItem.update({
                            where: { id: encaminhamentoAtualizado.id },
                            data: {
                                ...encaminhamentoAtualizado,
                                atualizado_em: new Date(Date.now()),
                                atualizado_por: user.id,
                            },
                        });
                    }
                } else {
                    // Verifica se existem encaminhamentos criados e caso existam, remover.
                    // Pois não foi enviada array de acompanhamentos
                    if (self.ProjetoAcompanhamentoItem.length) {
                        await prismaTx.projetoAcompanhamentoItem.updateMany({
                            where: { projeto_acompanhamento_id: self.id },
                            data: {
                                removido_em: new Date(Date.now()),
                                removido_por: user.id,
                            },
                        });
                    }
                }

                await this.atualizaProjeto(prismaTx, projeto_id, now);

                if (dto.apresentar_no_relatorio) {
                    await prismaTx.projetoAcompanhamento.updateMany({
                        where: {
                            id: { not: id },
                            projeto_id: projeto_id,
                            removido_em: null,
                        },
                        data: { apresentar_no_relatorio: false },
                    });
                }

                // pode ser que seja necessário criar uma regra para validar que pelo menos 1 ainda fica como true, ou seja
                // não pode nunca aceitar o apresentar_no_relatorio como false no endpoint de update
                return await prismaTx.projetoAcompanhamento.update({
                    where: {
                        id,
                    },
                    data: {
                        pauta: dto.pauta,
                        data_registro: dto.data_registro,
                        participantes: dto.participantes,
                        detalhamento: dto.detalhamento,
                        observacao: dto.observacao,
                        detalhamento_status: dto.detalhamento_status,
                        pontos_atencao: dto.pontos_atencao,
                        cronograma_paralisado: dto.cronograma_paralisado,
                        apresentar_no_relatorio: dto.apresentar_no_relatorio,
                        acompanhanmento_tipo_id: dto.acompanhamento_tipo_id,

                        atualizado_em: now,
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });
            },
            {
                isolationLevel: 'Serializable',
            }
        );

        return updated;
    }

    private async atualizaProjeto(prismaTx: Prisma.TransactionClient, projeto_id: number, now: Date) {
        await prismaTx.tarefaCronograma.updateMany({
            where: { projeto_id: projeto_id, removido_em: null },
            data: {
                tarefas_proximo_recalculo: now,
            },
        });
    }

    async remove(tipo: TipoProjeto, projeto_id: number, id: number, user: PessoaFromJwt) {
        await this.prisma.projetoAcompanhamento.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
                projeto_id: projeto_id,
                projeto: { tipo: tipo, id: projeto_id },
            },
            select: { id: true },
        });

        return await this.prisma.projetoAcompanhamento.updateMany({
            where: {
                id,
                projeto_id: projeto_id,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }
}
