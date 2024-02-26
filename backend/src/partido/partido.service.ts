import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';

@Injectable()
export class PartidoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreatePartidoDto, user?: PessoaFromJwt) {
        const similarExists = await this.prisma.partido.count({
            where: {
                nome: { endsWith: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

        if (dto.sigla) {
            const similarExists = await this.prisma.partido.count({
                where: {
                    sigla: { endsWith: dto.sigla, mode: 'insensitive' },
                    removido_em: null,
                },
            });
            if (similarExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        const similarNumeroExists = await this.prisma.partido.count({
            where: {
                numero: dto.numero,
                removido_em: null,
            },
        });
        if (similarNumeroExists > 0)
            throw new HttpException('número| Número igual já existe em outro registro ativo', 400);

        const created = await this.prisma.partido.create({
            data: {
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
                ...dto,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.partido.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                sigla: true,
                numero: true
            },
            orderBy: [{ sigla: 'asc' }],
        });
        return listActive;
    }

    async findOne(id: number, user: PessoaFromJwt) {
        return await this.prisma.partido.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
    }

    async update(id: number, dto: UpdatePartidoDto, user: PessoaFromJwt) {
        if (dto.nome !== undefined) {
            const similarExists = await this.prisma.partido.count({
                where: {
                    nome: { endsWith: dto.nome, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException(
                    'nome| Nome igual ou semelhante já existe em outro registro ativo',
                    400
                );
        }

        if (dto.sigla) {
            const similarExists = await this.prisma.orgao.count({
                where: {
                    sigla: { endsWith: dto.sigla, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (dto.numero) {
            const similarNumeroExists = await this.prisma.partido.count({
                where: {
                    numero: dto.numero,
                    removido_em: null,
                },
            });
            if (similarNumeroExists > 0)
                throw new HttpException('número| Número igual já existe em outro registro ativo', 400);
        }

        await this.prisma.partido.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...dto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO verificar dependentes

        const deleted = await this.prisma.partido.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return deleted;
    }
}
