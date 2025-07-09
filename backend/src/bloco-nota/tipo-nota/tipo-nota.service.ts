import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoNota } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTipoNotaDto, FilterTipoNota, TipoNotaItem, UpdateTipoNotaDto } from './dto/tipo-nota.dto';

@Injectable()
export class TipoNotaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateTipoNotaDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.tipoNota.count({
            where: {
                codigo: { equals: dto.codigo, mode: 'insensitive' },
            },
        });

        if (similarExists > 0)
            throw new BadRequestException('codigo| Descrição igual ou semelhante já existe em outro registro ativo');

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const created = await prismaTx.tipoNota.create({
                data: {
                    criado_em: new Date(Date.now()),
                    codigo: dto.codigo,
                    permite_email: dto.permite_email,
                    permite_enderecamento: dto.permite_enderecamento,
                    permite_replica: dto.permite_replica,
                    permite_revisao: dto.permite_revisao,
                    visivel_resp_orgao: dto.visivel_resp_orgao,
                    eh_publico: dto.eh_publico,
                    TipoNotaModulo: {
                        createMany: {
                            data: dto.modulos.map((m) => {
                                return {
                                    modulo_sistema: m,
                                };
                            }),
                        },
                    },
                },
            });
            this.verificaRegras(created);

            return created;
        });
        return created;
    }

    async findAll(filters: FilterTipoNota): Promise<TipoNotaItem[]> {
        const listActive = await this.prisma.tipoNota.findMany({
            where: {
                removido_em: null,
                id: filters.id,
            },
            select: {
                id: true,
                codigo: true,
                permite_email: true,
                permite_enderecamento: true,
                permite_replica: true,
                permite_revisao: true,
                visivel_resp_orgao: true,
                eh_publico: true,
                TipoNotaModulo: {
                    select: {
                        modulo_sistema: true,
                    },
                },
            },
            orderBy: { codigo: 'asc' },
        });

        return listActive.map((r) => {
            return {
                id: r.id,
                codigo: r.codigo,
                permite_email: r.permite_email,
                permite_enderecamento: r.permite_enderecamento,
                permite_replica: r.permite_replica,
                permite_revisao: r.permite_revisao,
                visivel_resp_orgao: r.visivel_resp_orgao,
                eh_publico: r.eh_publico,
                modulos: r.TipoNotaModulo.map((r) => r.modulo_sistema),
            };
        });
    }

    async findOneOrThrow(id: number): Promise<TipoNotaItem> {
        const list = await this.findAll({ id: id });
        if (list[0]) return list[0];
        throw new NotFoundException();
    }

    async update(id: number, dto: UpdateTipoNotaDto, user: PessoaFromJwt) {
        await this.prisma.tipoNota.findFirstOrThrow({
            where: { id: id, removido_em: null },
        });

        if (dto.codigo !== undefined) {
            const similarExists = await this.prisma.tipoNota.count({
                where: {
                    codigo: { equals: dto.codigo, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });

            if (similarExists > 0)
                throw new HttpException('codigo| Código igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const updated = await prismaTx.tipoNota.update({
                where: { id: id },
                data: {
                    atualizado_em: new Date(Date.now()),
                    codigo: dto.codigo,
                    permite_email: dto.permite_email,
                    permite_enderecamento: dto.permite_enderecamento,
                    permite_replica: dto.permite_replica,
                    permite_revisao: dto.permite_revisao,
                    visivel_resp_orgao: dto.visivel_resp_orgao,
                    eh_publico: dto.eh_publico,
                },
            });

            this.verificaRegras(updated);

            if (Array.isArray(dto.modulos)) {
                await prismaTx.tipoNotaModulo.deleteMany({
                    where: { tipo_nota_id: id },
                });

                if (dto.modulos.length)
                    await prismaTx.tipoNotaModulo.createMany({
                        data: dto.modulos.map((m) => {
                            return {
                                modulo_sistema: m,
                                tipo_nota_id: id,
                            };
                        }),
                    });
            }
        });

        return { id };
    }

    private verificaRegras(_tipoNota: TipoNota) {
        //        if (tipoNota.permite_enderecamento && tipoNota.eh_publico == false)
        //            throw new BadRequestException(
        //                'Não é permitido encaminhar notas que são privadas, pois não é possível encaminhar.'
        //            );
        //
        //        if (tipoNota.permite_replica && tipoNota.eh_publico == false)
        //            throw new BadRequestException(
        //                'Não é permitido replica notas que são privadas, pois não é possível encaminhar.'
        //            );
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.tipoNota.updateMany({
            where: { id: id, removido_em: null },
            data: {
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
