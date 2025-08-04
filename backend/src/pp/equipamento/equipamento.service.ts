import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Equipamento } from './entities/equipamento.entity';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';

@Injectable()
export class EquipamentoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateEquipamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await prismaTx.equipamento.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const equipamento = await prismaTx.equipamento.create({
                    data: {
                        nome: dto.nome,
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                });

                return { id: equipamento.id };
            }
        );

        return { id: created.id };
    }

    async findAll(user: PessoaFromJwt): Promise<Equipamento[]> {
        const equipamentos = await this.prisma.equipamento.findMany({
            where: {
                removido_em: null,
            },
            orderBy: [{ nome: 'asc' }],
            select: {
                id: true,
                nome: true,
            },
        });

        return equipamentos;
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<Equipamento> {
        const equipamento = await this.prisma.equipamento.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
            },
        });
        if (!equipamento) throw new NotFoundException('Não foi possível encontrar equipamento.');

        return equipamento;
    }

    async update(id: number, dto: UpdateEquipamentoDto, user: PessoaFromJwt) {
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTx.equipamento.findFirstOrThrow({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: { nome: true },
                });

                if (dto.nome && dto.nome != self.nome) {
                    const similarExists = await prismaTx.equipamento.count({
                        where: {
                            nome: { endsWith: dto.nome, mode: 'insensitive' },
                            removido_em: null,
                            id: { not: id },
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'nome| Nome igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                return await prismaTx.equipamento.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });
            }
        );

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.projeto.count({
            where: {
                removido_em: null,
                equipamento_id: id,
            },
        });
        if (emUso > 0) {
            throw new HttpException('Equipamento em uso, não pode ser removido', 400);
        }

        await this.prisma.equipamento.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
            },
            select: { id: true },
        });

        return await this.prisma.equipamento.updateMany({
            where: {
                id,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }
}
