import { HttpException, Injectable } from '@nestjs/common';
import { TipoProjeto } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjetoTagDto } from './dto/create-tag.dto';
import { FilterProjetoTagDto } from './dto/filter-tag.dto';
import { ProjetoUpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class ProjetoTagService {
    constructor(private readonly prisma: PrismaService) {}

    async create(tipo: TipoProjeto, createTagDto: CreateProjetoTagDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.projetoTag.count({
            where: {
                tipo_projeto: tipo,
                descricao: { equals: createTagDto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.projetoTag.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                descricao: createTagDto.descricao,
                tipo_projeto: tipo,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(tipo: TipoProjeto, filters: FilterProjetoTagDto) {
        const listActive = await this.prisma.projetoTag.findMany({
            where: {
                tipo_projeto: tipo,
                removido_em: null,
                id: filters.id,
            },
            select: {
                id: true,
                descricao: true,
            },
            orderBy: { descricao: 'asc' },
        });

        return listActive;
    }

    async update(tipo: TipoProjeto, id: number, updateTagDto: ProjetoUpdateTagDto, user: PessoaFromJwt) {
        const self = await this.prisma.projetoTag.findFirstOrThrow({
            where: { id: id, tipo_projeto: tipo },
            select: { id: true },
        });

        if (updateTagDto.descricao !== undefined) {
            const similarExists = await this.prisma.projetoTag.count({
                where: {
                    descricao: { equals: updateTagDto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    tipo_projeto: tipo,
                    NOT: { id: self.id },
                },
            });

            if (similarExists > 0)
                throw new HttpException(
                    'descricao| Descrição igual ou semelhante já existe em outro registro ativo',
                    400
                );
        }

        await this.prisma.projetoTag.update({
            where: { id: id, tipo_projeto: tipo },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                descricao: updateTagDto.descricao,
            },
        });

        return { id };
    }

    async remove(tipo: TipoProjeto, id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.projeto.count({
            where: {
                tipo: tipo,
                removido_em: null,
                tags: {
                    has: id,
                },
            },
        });
        if (emUso > 0) throw new HttpException('Tag em uso em um ou mais obras.', 400);

        const created = await this.prisma.projetoTag.updateMany({
            where: { id: id, tipo_projeto: tipo },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
