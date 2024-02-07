import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObjetivoEstrategicoDto } from './dto/create-objetivo-estrategico.dto';
import { FilterObjetivoEstrategicoDto } from './dto/filter-objetivo-estrategico.dto';
import { UpdateObjetivoEstrategicoDto } from './dto/update-objetivo-estrategico.dto';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@Injectable()
export class ObjetivoEstrategicoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createObjetivoEstrategicoDto: CreateObjetivoEstrategicoDto, user: PessoaFromJwt) {
        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const descricaoExists = await prismaTx.tema.count({
                where: {
                    pdm_id: createObjetivoEstrategicoDto.pdm_id,
                    descricao: {
                        equals: createObjetivoEstrategicoDto.descricao,
                        mode: 'insensitive',
                    },
                },
            });
            if (descricaoExists) throw new HttpException('descricao| Já existe um Tema com esta descrição.', 400);

            const tema = await prismaTx.tema.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createObjetivoEstrategicoDto,
                },
                select: { id: true, descricao: true },
            });

            return tema;
        });

        return created;
    }

    async findAll(filters: FilterObjetivoEstrategicoDto | undefined = undefined) {
        const pdmId = filters?.pdm_id;

        const listActive = await this.prisma.tema.findMany({
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

    async update(id: number, updateObjetivoEstrategicoDto: UpdateObjetivoEstrategicoDto, user: PessoaFromJwt) {
        delete updateObjetivoEstrategicoDto.pdm_id; // nao deixa editar o PDM

        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (updateObjetivoEstrategicoDto.descricao) {
                    const self = await prismaTx.tema.findFirstOrThrow({
                        where: { id },
                        select: { pdm_id: true },
                    });

                    const descricaoExists = await prismaTx.tema.count({
                        where: {
                            pdm_id: self.pdm_id,
                            descricao: {
                                equals: updateObjetivoEstrategicoDto.descricao,
                                mode: 'insensitive',
                            },
                        },
                    });
                    if (descricaoExists)
                        throw new HttpException('descricao| Já existe um Tema com esta descrição.', 400);
                }

                const tema = await this.prisma.tema.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...updateObjetivoEstrategicoDto,
                    },
                    select: { id: true },
                });

                return tema;
            }
        );

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.meta.count({ where: { tema_id: id, removido_em: null } });
        if (emUso > 0)
            throw new HttpException('Objetivo Estratégico em uso em Metas.', 400);

        const created = await this.prisma.tema.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
