import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEixoDto } from './dto/create-macro-tema.dto';
import { FilterEixoDto } from './dto/filter-macro-tema.dto';
import { UpdateEixoDto } from './dto/update-macro-tema.dto';
import { Prisma, TipoPdm } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@Injectable()
export class MacroTemaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(tipo: TipoPdm, createEixoDto: CreateEixoDto, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const pdm = await prismaTx.pdm.count({
                where: {
                    tipo,
                    id: createEixoDto.pdm_id,
                    removido_em: null,
                },
            });
            if (!pdm) throw new HttpException('pdm| Não foi encontrado linha de PDM correspondente.', 400);

            const descricaoExists = await prismaTx.macroTema.count({
                where: {
                    pdm_id: createEixoDto.pdm_id,
                    pdm: { tipo, id: createEixoDto.pdm_id },
                    descricao: {
                        equals: createEixoDto.descricao,
                        mode: 'insensitive',
                    },
                },
            });
            if (descricaoExists) throw new HttpException('descricao| Já existe um Macro Tema com esta descrição.', 400);

            const macroTema = await prismaTx.macroTema.create({
                data: {
                    criado_por: user.id,
                    criado_em: now,
                    ...createEixoDto,
                },
                select: { id: true, descricao: true },
            });

            return macroTema;
        });

        return created;
    }

    async findAll(tipo: TipoPdm, filters: FilterEixoDto) {
        const listActive = await this.prisma.macroTema.findMany({
            where: {
                removido_em: null,
                pdm_id: filters.pdm_id,
                pdm: { tipo, id: filters.pdm_id },
                id: filters.id,
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

    async update(tipo: TipoPdm, id: number, updateEixoDto: UpdateEixoDto, user: PessoaFromJwt) {
        delete updateEixoDto.pdm_id; // nao deixa editar o PDM

        const now = new Date(Date.now());
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (updateEixoDto.descricao) {
                    const self = await prismaTx.macroTema.findFirstOrThrow({
                        where: { id, pdm: { tipo } },
                        select: { pdm_id: true },
                    });

                    const descricaoExists = await prismaTx.macroTema.count({
                        where: {
                            pdm_id: self.pdm_id,
                            descricao: {
                                equals: updateEixoDto.descricao,
                                mode: 'insensitive',
                            },
                            NOT: {
                                id,
                            },
                        },
                    });
                    if (descricaoExists)
                        throw new HttpException('descricao| Já existe um Macro Tema com esta descrição.', 400);
                }

                const macroTema = await prismaTx.macroTema.update({
                    where: { id: id, pdm: { tipo } },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: now,
                        ...updateEixoDto,
                    },
                    select: { id: true },
                });

                return macroTema;
            }
        );

        return updated;
    }

    async remove(tipo: TipoPdm, id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.meta.count({ where: { macro_tema_id: id, removido_em: null } });
        if (emUso > 0) throw new HttpException('Eixo em uso em Metas.', 400);

        const created = await this.prisma.macroTema.updateMany({
            where: { id: id, pdm: { tipo } },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
