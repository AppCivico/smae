import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateContratoAditivoDto } from './dto/create-contrato-aditivo.dto';
import { ContratoAditivoItemDto } from './entities/contrato-aditivo.entity';
import { UpdateContratoAditivoDto } from './dto/update-contrato-aditivo.dto';

@Injectable()
export class ContratoAditivoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(contrato_id: number, dto: CreateContratoAditivoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExiste = await prismaTx.contratoAditivo.count({
                    where: {
                        numero: dto.numero,
                        contrato_id: contrato_id,
                        removido_em: null,
                    },
                });
                if (similarExiste > 0) throw new HttpException('Número igual já existe em outro registro ativo', 400);

                const tipoAditivo = await prismaTx.tipoAditivo.findFirstOrThrow({
                    where: {
                        id: dto.tipo_aditivo_id,
                        removido_em: null,
                    },
                    select: {
                        habilita_valor: true,
                        habilita_valor_data_termino: true,
                    },
                });

                if (tipoAditivo.habilita_valor && dto.valor === null)
                    throw new HttpException('Valor é obrigatório para este tipo de aditivo', 400);

                if (tipoAditivo.habilita_valor_data_termino && dto.data_termino_atualizada === null)
                    throw new HttpException('Data de termino atualizada é obrigatória para este tipo de aditivo', 400);

                const aditivo = await prismaTx.contratoAditivo.create({
                    data: {
                        contrato_id: contrato_id,
                        numero: dto.numero,
                        tipo_aditivo_id: dto.tipo_aditivo_id,
                        data: dto.data,
                        data_termino_atualizada: dto.data_termino_atualizada,
                        valor: dto.valor,
                        percentual_medido: dto.percentual_medido,
                        criado_em: now,
                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                return { id: aditivo.id };
            }
        );

        return { id: created.id };
    }

    async findAll(contrato_id: number, user: PessoaFromJwt): Promise<ContratoAditivoItemDto[]> {
        const linhasContratoAditivo = await this.prisma.contratoAditivo.findMany({
            where: {
                contrato_id: contrato_id,
                removido_em: null,
            },
            orderBy: [{ numero: 'asc' }],
            select: {
                id: true,
                numero: true,
                data: true,
                data_termino_atualizada: true,
                valor: true,
                percentual_medido: true,
                tipo_aditivo: {
                    select: {
                        nome: true,
                        habilita_valor: true,
                        habilita_valor_data_termino: true,
                    },
                },
            },
        });

        return linhasContratoAditivo.map((aditivo) => {
            return {
                id: aditivo.id,
                numero: aditivo.numero,
                data: aditivo.data,
                data_termino_atualizada: aditivo.data_termino_atualizada,
                valor: aditivo.valor,
                percentual_medido: aditivo.percentual_medido,
                tipo: {
                    nome: aditivo.tipo_aditivo.nome,
                    habilita_valor: aditivo.tipo_aditivo.habilita_valor,
                    habilita_valor_data_termino: aditivo.tipo_aditivo.habilita_valor_data_termino,
                },
            };
        });
    }

    async update(contrato_id: number, id: number, dto: UpdateContratoAditivoDto, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTx.contratoAditivo.findFirstOrThrow({
                    where: {
                        removido_em: null,
                        id: id,
                        contrato_id: contrato_id,
                    },
                    select: {
                        numero: true,
                        tipo_aditivo: {
                            select: {
                                id: true,
                                habilita_valor: true,
                                habilita_valor_data_termino: true,
                            },
                        },
                    },
                });

                if (dto.numero !== undefined && dto.numero !== self.numero) {
                    const similarExiste = await prismaTx.contratoAditivo.count({
                        where: {
                            numero: dto.numero,
                            contrato_id: contrato_id,
                            removido_em: null,
                        },
                    });
                    if (similarExiste > 0)
                        throw new HttpException('Número igual já existe em outro registro ativo', 400);
                }

                // Verifica se o tipo de aditivo exige valor e se o valor foi informado.
                if (dto.tipo_aditivo_id !== undefined && dto.tipo_aditivo_id != self.tipo_aditivo.id) {
                    const tipoAditivo = await prismaTx.tipoAditivo.findFirstOrThrow({
                        where: {
                            id: dto.tipo_aditivo_id,
                            removido_em: null,
                        },
                        select: {
                            habilita_valor: true,
                            habilita_valor_data_termino: true,
                        },
                    });

                    if (tipoAditivo.habilita_valor && dto.valor === null)
                        throw new HttpException('Valor| Obrigatório para este tipo de aditivo', 400);

                    if (tipoAditivo.habilita_valor_data_termino && dto.data === null)
                        throw new HttpException('Data| Obrigatória para este tipo de aditivo', 400);
                }

                return await prismaTx.contratoAditivo.update({
                    where: {
                        id,
                        contrato_id,
                    },
                    data: {
                        data: dto.data,
                        data_termino_atualizada: dto.data_termino_atualizada,
                        valor: dto.valor,
                        percentual_medido: dto.percentual_medido,
                        numero: dto.numero,
                        tipo_aditivo_id: dto.tipo_aditivo_id,
                        atualizado_em: now,
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });
            }
        );

        return updated;
    }

    async remove(contrato_id: number, id: number, user: PessoaFromJwt) {
        await this.prisma.contratoAditivo.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
                contrato_id: contrato_id,
            },
            select: { id: true },
        });

        return await this.prisma.contratoAditivo.updateMany({
            where: {
                id,
                contrato_id: contrato_id,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }
}
