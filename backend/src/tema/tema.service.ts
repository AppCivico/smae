import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObjetivoEstrategicoDto } from './dto/create-tema.dto';
import { FilterObjetivoEstrategicoDto } from './dto/filter-tema.dto';
import { UpdateObjetivoEstrategicoDto } from './dto/update-tema.dto';
import { Prisma, TipoPdm } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ObjetivoEstrategicoDto } from './entities/objetivo-estrategico.entity';

@Injectable()
export class TemaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(tipo: TipoPdm, dto: CreateObjetivoEstrategicoDto, user: PessoaFromJwt) {
        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const descricaoExists = await prismaTx.tema.count({
                where: {
                    pdm_id: dto.pdm_id,
                    pdm: { tipo, id: dto.pdm_id },
                    removido_em: null,
                    descricao: {
                        equals: dto.descricao,
                        mode: 'insensitive',
                    },
                },
            });
            if (descricaoExists) throw new HttpException('descricao| Já existe um Tema com esta descrição.', 400);

            const tema = await prismaTx.tema.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...dto,
                },
                select: { id: true, descricao: true },
            });

            return tema;
        });

        return created;
    }

    async findAll(tipo: TipoPdm, filters: FilterObjetivoEstrategicoDto): Promise<ObjetivoEstrategicoDto[]> {
        const pdmId = filters.pdm_id;

        const listActive = await this.prisma.tema.findMany({
            where: {
                removido_em: null,
                id: filters.id,
                pdm_id: pdmId,
                pdm: { tipo, id: pdmId },
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

    async update(tipo: TipoPdm, id: number, dto: UpdateObjetivoEstrategicoDto, user: PessoaFromJwt) {
        delete dto.pdm_id; // nao deixa editar o PDM

        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.descricao) {
                    const self = await prismaTx.tema.findFirstOrThrow({
                        where: { id, pdm: { tipo } },
                        select: { pdm_id: true },
                    });

                    const descricaoExists = await prismaTx.tema.count({
                        where: {
                            pdm_id: self.pdm_id,
                            removido_em: null,
                            descricao: {
                                equals: dto.descricao,
                                mode: 'insensitive',
                            },
                            NOT: {
                                id,
                            },
                        },
                    });
                    if (descricaoExists)
                        throw new HttpException('descricao| Já existe um Tema com esta descrição.', 400);
                }

                const tema = await this.prisma.tema.update({
                    where: { id: id, pdm: { tipo } },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...dto,
                    },
                    select: { id: true },
                });

                return tema;
            }
        );

        return updated;
    }

    async remove(tipo: TipoPdm, id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.meta.count({ where: { tema_id: id, removido_em: null, pdm: { tipo } } });
        if (emUso > 0) throw new HttpException('Objetivo Estratégico em uso em Metas.', 400);

        const created = await this.prisma.tema.updateMany({
            where: { id: id, pdm: { tipo } },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
