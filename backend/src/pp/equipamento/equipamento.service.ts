import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Equipamento } from './entities/equipamento.entity';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';

@Injectable()
export class EquipamentoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(projetoId: number, dto: CreateEquipamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await prismaTx.equipamento.count({
                    where: {
                        projeto_id: projetoId,
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('fonte| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const equipamento = await prismaTx.equipamento.create({
                    data: {
                        projeto_id: projetoId,
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

    async findAll(projetoId: number, user: PessoaFromJwt): Promise<Equipamento[]> {
        const equipamentos = await this.prisma.equipamento.findMany({
            where: {
                projeto_id: projetoId,
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

    async findOne(projetoId: number, id: number, user: PessoaFromJwt): Promise<Equipamento> {
        const equipamento = await this.prisma.equipamento.findFirst({
            where: {
                id,
                projeto_id: projetoId,
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
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'fonte| Nome igual ou semelhante já existe em outro registro ativo',
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

    async remove(projeto_id: number, id: number, user: PessoaFromJwt) {
        await this.prisma.equipamento.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
                projeto_id: projeto_id,
            },
            select: { id: true },
        });

        return await this.prisma.equipamento.updateMany({
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
