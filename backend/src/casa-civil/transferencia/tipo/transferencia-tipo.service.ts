import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from '../../../../src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTransferenciaTipoDto } from './dto/create-transferencia-tipo.dto';
import { UpdateTransferenciaTipoDto } from './dto/update-transferencia-tipo.dto';
import { TransferenciaTipoDto } from './entities/transferencia-tipo.dto';

@Injectable()
export class TransferenciaTipoService {
    constructor(private readonly prisma: PrismaService) {}

    async createTransferenciaTipo(dto: CreateTransferenciaTipoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.transferenciaTipo.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const transferenciaTipo = await prismaTxn.transferenciaTipo.create({
                    data: {
                        nome: dto.nome,
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return transferenciaTipo;
            }
        );

        return created;
    }

    async findAllTransferenciaTipo(): Promise<TransferenciaTipoDto[]> {
        const rows = await this.prisma.transferenciaTipo.findMany({
            where: { removido_em: null },
            orderBy: { nome: 'asc' },
            select: {
                id: true,
                nome: true,
                categoria: true,
                esfera: true,
            },
        });

        return rows;
    }

    async updateTransferenciaTipo(
        id: number,
        dto: UpdateTransferenciaTipoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferenciaTipo = await prismaTxn.transferenciaTipo.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: {
                        nome: true,
                        categoria: true,
                        esfera: true,
                    },
                });

                const similarExists = await this.prisma.transferenciaTipo.count({
                    where: {
                        nome: { endsWith: transferenciaTipo.nome, mode: 'insensitive' },
                        categoria: transferenciaTipo.categoria,
                        esfera: transferenciaTipo.esfera,
                        removido_em: null,
                    },
                });
                if (similarExists > 1) throw new HttpException('Já existe um registro com estes campos.', 400);

                return { id };
            }
        );

        return updated;
    }

    async removeTransferenciaTipo(id: number, user: PessoaFromJwt) {
        await this.prisma.transferenciaTipo.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
