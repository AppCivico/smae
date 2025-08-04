import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTipoIntervencaoDto } from './dto/create-tipo-intervencao.dto';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { UpdateTipoIntervencaoDto } from './dto/update-tipo-intervencao.dto';
import { TipoIntervencao } from './entities/tipo-intervencao.entity';

@Injectable()
export class TipoIntervencaoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateTipoIntervencaoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await prismaTx.tipoIntervencao.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const tipoIntervencao = await prismaTx.tipoIntervencao.create({
                    data: {
                        nome: dto.nome,
                        conceito: dto.conceito,
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                });

                return { id: tipoIntervencao.id };
            }
        );

        return { id: created.id };
    }

    async findAll(user: PessoaFromJwt): Promise<TipoIntervencao[]> {
        const tiposIntervencao = await this.prisma.tipoIntervencao.findMany({
            where: {
                removido_em: null,
            },
            orderBy: [{ nome: 'asc' }],
            select: {
                id: true,
                nome: true,
                conceito: true,
            },
        });

        return tiposIntervencao;
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<TipoIntervencao> {
        const tipoIntervencao = await this.prisma.tipoIntervencao.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                conceito: true,
            },
        });
        if (!tipoIntervencao) throw new NotFoundException('Não foi possível encontrar tipoIntervencao.');

        return tipoIntervencao;
    }

    async update(id: number, dto: UpdateTipoIntervencaoDto, user: PessoaFromJwt) {
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTx.tipoIntervencao.findFirstOrThrow({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: { nome: true },
                });

                if (dto.nome && dto.nome != self.nome) {
                    const similarExists = await prismaTx.tipoIntervencao.count({
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

                return await prismaTx.tipoIntervencao.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        conceito: dto.conceito,
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
                tipo_intervencao_id: id,
            },
        });
        if (emUso > 0) {
            throw new HttpException('Tipo de intervenção em uso, não pode ser removida.', 400);
        }

        await this.prisma.tipoIntervencao.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
            },
            select: { id: true },
        });

        return await this.prisma.tipoIntervencao.updateMany({
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
