import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { CreateEmpreendimentoDto } from './dto/create-empreendimento.dto';
import { UpdateEmpreendimentoDto } from './dto/update-empreendimento.dto';
import { EmpreendimentoDto } from './entities/empreendimento.entity';

@Injectable()
export class EmpreendimentoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateEmpreendimentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExistsNome = await prismaTx.empreendimento.count({
                    where: {
                        nome: { equals: dto.nome, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExistsNome > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const similarExistsIdentificador = await prismaTx.empreendimento.count({
                    where: {
                        identificador: { equals: dto.identificador, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExistsIdentificador > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const empreendimento = await prismaTx.empreendimento.create({
                    data: {
                        nome: dto.nome,
                        identificador: dto.identificador,
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                });

                return { id: empreendimento.id };
            }
        );

        return { id: created.id };
    }

    async findAll(user: PessoaFromJwt): Promise<EmpreendimentoDto[]> {
        const equipamentos = await this.prisma.empreendimento.findMany({
            where: {
                removido_em: null,
            },
            orderBy: [{ identificador: 'asc' }],
            select: {
                id: true,
                nome: true,
                identificador: true,
            },
        });

        return equipamentos;
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<EmpreendimentoDto> {
        const empreendimento = await this.prisma.empreendimento.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                identificador: true,
            },
        });
        if (!empreendimento) throw new NotFoundException('Não foi possível encontrar empreendimento.');

        return empreendimento;
    }

    async update(id: number, dto: UpdateEmpreendimentoDto, user: PessoaFromJwt) {
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTx.empreendimento.findFirstOrThrow({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: { nome: true, identificador: true },
                });

                if (dto.nome && dto.nome != self.nome) {
                    const similarExists = await prismaTx.empreendimento.count({
                        where: {
                            nome: { equals: dto.nome, mode: 'insensitive' },
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

                if (dto.identificador && dto.identificador != self.identificador) {
                    const similarExists = await prismaTx.empreendimento.count({
                        where: {
                            identificador: { equals: dto.identificador, mode: 'insensitive' },
                            removido_em: null,
                            id: { not: id },
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'identificador| identificador igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                return await prismaTx.empreendimento.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        identificador: dto.identificador,
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
            throw new HttpException('Empreendimento em uso, não pode ser removido', 400);
        }

        await this.prisma.empreendimento.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
            },
            select: { id: true },
        });

        return await this.prisma.empreendimento.updateMany({
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
