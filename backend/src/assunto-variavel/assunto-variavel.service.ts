import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import {
    CreateAssuntoVariavelDto,
    FilterAssuntoVariavelDto,
    UpdateAssuntoVariavelDto,
} from './dto/assunto-variavel.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';

@Injectable()
export class ProjetoAssuntoVariavelService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateAssuntoVariavelDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.assuntoVariavel.count({
            where: {
                nome: { equals: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.assuntoVariavel.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                nome: dto.nome,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(filters: FilterAssuntoVariavelDto) {
        const listActive = await this.prisma.assuntoVariavel.findMany({
            where: {
                removido_em: null,
                id: filters.id,
            },
            select: {
                id: true,
                nome: true,
            },
            orderBy: { nome: 'asc' },
        });

        return listActive;
    }

    async update(id: number, dto: UpdateAssuntoVariavelDto, user: PessoaFromJwt) {
        const self = await this.prisma.assuntoVariavel.findFirstOrThrow({
            where: { id: id },
            select: { id: true },
        });

        if (dto.nome !== undefined) {
            const similarExists = await this.prisma.assuntoVariavel.count({
                where: {
                    nome: { equals: dto.nome, mode: 'insensitive' },
                    removido_em: null,

                    NOT: { id: self.id },
                },
            });

            if (similarExists > 0)
                throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.assuntoVariavel.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                nome: dto.nome,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.variavelAssuntoVariavel.findMany({
            where: {
                assunto_variavel_id: id,
            },
            select: {
                id: true,
                variavel: { select: { titulo: true } },
            },
        });

        if (emUso.length)
            throw new BadRequestException(
                'Registro em uso em variáveis: ' + emUso.map((v) => v.variavel.titulo).join(', ')
            );

        const created = await this.prisma.assuntoVariavel.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
