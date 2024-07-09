import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateContratoDto } from './dto/create-contrato.dto';
import { ContratoDetailDto, ContratoItemDto } from './entities/contrato.entity';
import { UpdateContratoDto } from './dto/update-contrato.dto';

@Injectable()
export class ContratoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(projeto_id: number, dto: CreateContratoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Caso enviem fonte de recurso, verificar se a fonte de recurso pertence ao projeto.
                if (dto.fontes_recurso_ids != undefined && dto.fontes_recurso_ids.length) {
                    const fontesRecurso = await prismaTx.projetoFonteRecurso.findMany({
                        where: {
                            projeto_id: projeto_id,
                            id: {
                                in: dto.fontes_recurso_ids,
                            },
                        },
                        select: { id: true },
                    });

                    if (fontesRecurso.length != dto.fontes_recurso_ids.length) {
                        throw new HttpException(
                            'Fontes de recurso inválidas. Todas as fontes devem pertencer ao projeto.',
                            400
                        );
                    }
                }

                const similarExiste = await prismaTx.contrato.count({
                    where: {
                        numero: { equals: dto.numero, mode: 'insensitive' },
                        projeto_id: projeto_id,
                        removido_em: null,
                    },
                });
                if (similarExiste > 0)
                    throw new HttpException('Número igual ou semelhante já existe em outro registro ativo', 400);

                const contrato = await prismaTx.contrato.create({
                    data: {
                        projeto_id: projeto_id,
                        numero: dto.numero,
                        contrato_exclusivo: dto.contrato_exclusivo,
                        status: dto.status,
                        modalidade_contratacao_id: dto.modalidade_contratacao_id,
                        orgao_id: dto.orgao_id,
                        objeto_resumo: dto.objeto_resumo,
                        objeto_detalhado: dto.objeto_detalhado,
                        contratante: dto.contratante,
                        empresa_contratada: dto.empresa_contratada,
                        cnpj_contratada: dto.cnpj_contratada,
                        observacoes: dto.observacoes,
                        data_assinatura: dto.data_assinatura,
                        data_inicio: dto.data_inicio,
                        prazo_numero: dto.prazo_numero,
                        prazo_unidade: dto.prazo_unidade,
                        data_base_mes: dto.data_base_mes,
                        data_base_ano: dto.data_base_ano,
                        valor: dto.valor,
                        fontesRecurso: {
                            createMany: {
                                data: dto.fontes_recurso_ids.map((fonte_recurso_id) => {
                                    return {
                                        projeto_fonte_recurso_id: fonte_recurso_id,
                                    };
                                }),
                            },
                        },
                        processosSei: {
                            createMany: {
                                data: dto.processos_sei.map((processo_sei) => {
                                    return {
                                        numero_sei: processo_sei,
                                    };
                                }),
                            },
                        },

                        criado_em: now,
                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                return { id: contrato.id };
            }
        );

        return { id: created.id };
    }

    async findAll(projeto_id: number, user: PessoaFromJwt): Promise<ContratoItemDto[]> {
        const linhasContrato = await this.prisma.contrato.findMany({
            where: {
                projeto_id: projeto_id,
                removido_em: null,
            },
            orderBy: [{ numero: 'asc' }],
            select: {
                id: true,
                numero: true,
                status: true,
                data_inicio: true,
                valor: true,
                aditivos: {
                    orderBy: { numero: 'asc' },
                    select: {
                        id: true,
                        data: true,
                        data_termino_atualizada: true,
                        valor: true,
                    },
                },
                processosSei: {
                    select: {
                        numero_sei: true,
                    },
                },
            },
        });

        return linhasContrato.map((contrato) => {
            const valorMaisAtual = contrato.aditivos.find((aditivo) => aditivo.valor != null)?.valor || contrato.valor;

            const linhaComDatas = contrato.aditivos.find(
                (aditivo) => aditivo.data_termino_atualizada != null || aditivo.data != null
            );
            const dataMaisAtual = linhaComDatas?.data_termino_atualizada || linhaComDatas?.data || contrato.data_inicio;

            return {
                id: contrato.id,
                numero: contrato.numero,
                status: contrato.status,
                valor: valorMaisAtual,
                processos_sei: contrato.processosSei.map((processo) => processo.numero_sei),
                quantidade_aditivos: contrato.aditivos.length,
                data_termino_atual: contrato.aditivos.length > 0 ? contrato.aditivos[-1].data_termino_atualizada : null,
                data_termino_inicial: dataMaisAtual,
            };
        });
    }

    async findOne(projeto_id: number, id: number, user: PessoaFromJwt): Promise<ContratoDetailDto> {
        const contrato = await this.prisma.contrato.findFirst({
            where: {
                id,
                projeto_id: projeto_id,
                removido_em: null,
            },
            select: {
                id: true,
                numero: true,
                contrato_exclusivo: true,
                status: true,
                objeto_resumo: true,
                objeto_detalhado: true,
                contratante: true,
                empresa_contratada: true,
                cnpj_contratada: true,
                observacoes: true,
                data_assinatura: true,
                data_inicio: true,
                prazo_numero: true,
                prazo_unidade: true,
                data_base_mes: true,
                data_base_ano: true,
                valor: true,
                orgao: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                modalidade_contratacao: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
                fontesRecurso: {
                    select: {
                        projeto_fonte_recurso: {
                            select: {
                                id: true,
                                fonte_recurso_cod_sof: true,
                                fonte_recurso_ano: true,
                                valor_percentual: true,
                                valor_nominal: true,
                            },
                        },
                    },
                },
                processosSei: {
                    select: {
                        numero_sei: true,
                    },
                },
                aditivos: {
                    where: { removido_em: null },
                    orderBy: { numero: 'asc' },
                    select: {
                        id: true,
                        numero: true,
                        data: true,
                        data_termino_atualizada: true,
                        valor: true,
                        percentual_medido: true,
                        tipo_aditivo: {
                            select: {
                                id: true,
                                nome: true,
                                habilita_valor: true,
                                habilita_valor_data_termino: true,
                            },
                        },
                    },
                },
            },
        });
        if (!contrato) throw new NotFoundException('Contrato não encontrado');

        return {
            id: contrato.id,
            orgao: contrato.orgao,
            numero: contrato.numero,
            contrato_exclusivo: contrato.contrato_exclusivo,
            status: contrato.status,
            objeto_resumo: contrato.objeto_resumo,
            objeto_detalhado: contrato.objeto_detalhado,
            contratante: contrato.contratante,
            empresa_contratada: contrato.empresa_contratada,
            cnpj_contratada: contrato.cnpj_contratada,
            observacoes: contrato.observacoes,
            data_assinatura: contrato.data_assinatura,
            data_inicio: contrato.data_inicio,
            prazo_numero: contrato.prazo_numero,
            prazo_unidade: contrato.prazo_unidade,
            data_base_mes: contrato.data_base_mes,
            data_base_ano: contrato.data_base_ano,
            valor: contrato.valor,
            modalidade_contratacao: contrato.modalidade_contratacao
                ? { nome: contrato.modalidade_contratacao.nome }
                : null,
            fontes_recurso: contrato.fontesRecurso.map((fonte) => {
                return {
                    id: fonte.projeto_fonte_recurso.id,
                    fonte_recurso_cod_sof: fonte.projeto_fonte_recurso.fonte_recurso_cod_sof,
                    fonte_recurso_ano: fonte.projeto_fonte_recurso.fonte_recurso_ano,
                    valor_percentual: fonte.projeto_fonte_recurso.valor_percentual,
                    valor_nominal: fonte.projeto_fonte_recurso.valor_nominal,
                };
            }),
            processos_sei: contrato.processosSei.map((processo) => processo.numero_sei),
            aditivos: contrato.aditivos.map((aditivo) => {
                return {
                    id: aditivo.id,
                    numero: aditivo.numero,
                    data: aditivo.data,
                    data_termino_atualizada: aditivo.data_termino_atualizada,
                    valor: aditivo.valor,
                    percentual_medido: aditivo.percentual_medido,
                    tipo: {
                        id: aditivo.tipo_aditivo.id,
                        nome: aditivo.tipo_aditivo.nome,
                        habilita_valor: aditivo.tipo_aditivo.habilita_valor,
                        habilita_valor_data_termino: aditivo.tipo_aditivo.habilita_valor_data_termino,
                    },
                };
            }),
        };
    }

    async update(projeto_id: number, id: number, dto: UpdateContratoDto, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await this.findOne(projeto_id, id, user);
                if (dto.numero != undefined && dto.numero != self.numero) {
                    const similarExiste = await prismaTx.contrato.count({
                        where: {
                            numero: { equals: dto.numero, mode: 'insensitive' },
                            projeto_id: projeto_id,
                            removido_em: null,
                        },
                    });
                    if (similarExiste > 0)
                        throw new HttpException('Número igual ou semelhante já existe em outro registro ativo', 400);
                }

                if (dto.processos_sei != undefined) {
                    await prismaTx.contratoSei.deleteMany({
                        where: {
                            contrato_id: id,
                        },
                    });

                    await prismaTx.contratoSei.createMany({
                        data: dto.processos_sei.map((processo_sei) => {
                            return {
                                contrato_id: id,
                                numero_sei: processo_sei,
                            };
                        }),
                    });
                }

                if (dto.fontes_recurso_ids != undefined) {
                    await prismaTx.contratoFonteRecurso.deleteMany({
                        where: { contrato_id: id },
                    });

                    await prismaTx.contratoFonteRecurso.createMany({
                        data: dto.fontes_recurso_ids.map((fonte_recurso_id) => {
                            return {
                                contrato_id: id,
                                projeto_fonte_recurso_id: fonte_recurso_id,
                            };
                        }),
                    });
                }

                return await prismaTx.contrato.update({
                    where: {
                        id,
                        projeto_id,
                    },
                    data: {
                        // TODO: adicionar mais campos e tratamentos.
                        contrato_exclusivo: dto.contrato_exclusivo,
                        status: dto.status,
                        modalidade_contratacao_id: dto.modalidade_contratacao_id,
                        orgao_id: dto.orgao_id,
                        objeto_resumo: dto.objeto_resumo,
                        objeto_detalhado: dto.objeto_detalhado,
                        contratante: dto.contratante,
                        empresa_contratada: dto.empresa_contratada,
                        cnpj_contratada: dto.cnpj_contratada,
                        observacoes: dto.observacoes,
                        data_assinatura: dto.data_assinatura,
                        data_inicio: dto.data_inicio,
                        prazo_numero: dto.prazo_numero,
                        prazo_unidade: dto.prazo_unidade,
                        data_base_mes: dto.data_base_mes,
                        data_base_ano: dto.data_base_ano,
                        valor: dto.valor,

                        atualizado_em: now,
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });
            }
        );

        return updated;
    }

    async remove(projeto_id: number, id: number, user: PessoaFromJwt) {
        await this.prisma.contrato.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
                projeto_id: projeto_id,
            },
            select: { id: true },
        });

        return await this.prisma.contrato.updateMany({
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
