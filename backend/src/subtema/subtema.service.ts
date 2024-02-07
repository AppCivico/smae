import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubTemaDto } from './dto/create-subtema.dto';
import { FilterSubTemaDto } from './dto/filter-subtema.dto';
import { UpdateSubTemaDto } from './dto/update-subtema.dto';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@Injectable()
export class SubTemaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createSubTemaDto: CreateSubTemaDto, user: PessoaFromJwt) {
        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const descricaoExists = await prismaTx.subTema.count({
                where: {
                    pdm_id: createSubTemaDto.pdm_id,
                    descricao: {
                        equals: createSubTemaDto.descricao,
                        mode: 'insensitive',
                    },
                },
            });
            if (descricaoExists) throw new HttpException('descricao| Já existe um Sub-tema com esta descrição.', 400);

            const subTema = await prismaTx.subTema.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createSubTemaDto,
                },
                select: { id: true, descricao: true },
            });

            return subTema;
        });

        return created;
    }

    async findAll(filters: FilterSubTemaDto | undefined = undefined) {
        const pdmId = filters?.pdm_id;

        const listActive = await this.prisma.subTema.findMany({
            where: {
                removido_em: null,
                pdm_id: pdmId,
            },
            select: {
                id: true,
                descricao: true,
                pdm_id: true,
            },
            orderBy: { descricao: 'asc' },
        });
        return listActive;
    }

    async update(id: number, updateSubTemaDto: UpdateSubTemaDto, user: PessoaFromJwt) {
        delete updateSubTemaDto.pdm_id; // nao deixa editar o PDM

        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (updateSubTemaDto.descricao) {
                    const self = await prismaTx.subTema.findFirstOrThrow({
                        where: { id },
                        select: { pdm_id: true },
                    });

                    const descricaoExists = await prismaTx.subTema.count({
                        where: {
                            pdm_id: self.pdm_id,
                            descricao: {
                                equals: updateSubTemaDto.descricao,
                                mode: 'insensitive',
                            },
                        },
                    });
                    if (descricaoExists)
                        throw new HttpException('descricao| Já existe um Tema com esta descrição.', 400);
                }

                const subTema = await this.prisma.subTema.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...updateSubTemaDto,
                    },
                    select: { id: true },
                });

                return subTema;
            }
        );

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.meta.count({ where: { macro_tema_id: id, removido_em: null } });
        if (emUso > 0)
            throw new HttpException('Tema em uso em Metas.', 400);

        const created = await this.prisma.subTema.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
