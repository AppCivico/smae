import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PdmModoParaTipo, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { PdmService } from '../pdm/pdm.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubTemaDto } from './dto/create-subtema.dto';
import { FilterSubTemaDto } from './dto/filter-subtema.dto';
import { UpdateSubTemaDto } from './dto/update-subtema.dto';

@Injectable()
export class SubTemaService {
    constructor(
        private readonly prisma: PrismaService,
        //
        @Inject(PdmService)
        private readonly pdmService: PdmService
    ) {}

    async create(tipo: TipoPdmType, dto: CreateSubTemaDto, user: PessoaFromJwt) {
        await this.pdmService.getDetail(tipo, dto.pdm_id, user, 'ReadWrite');

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const pdm = await prismaTx.pdm.count({
                where: {
                    id: dto.pdm_id,
                    tipo: PdmModoParaTipo(tipo),
                    removido_em: null,
                },
            });
            if (!pdm) throw new HttpException('pdm_id| Não foi encontrado linha de PDM correspondente.', 400);

            const descricaoExists = await prismaTx.subTema.count({
                where: {
                    pdm_id: dto.pdm_id,
                    pdm: { tipo: PdmModoParaTipo(tipo), id: dto.pdm_id },
                    removido_em: null,
                    descricao: {
                        equals: dto.descricao,
                        mode: 'insensitive',
                    },
                },
            });
            if (descricaoExists) throw new HttpException('descricao| Já existe um Sub-tema com esta descrição.', 400);

            const subTema = await prismaTx.subTema.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...dto,
                },
                select: { id: true, descricao: true },
            });

            return subTema;
        });

        return created;
    }

    async findAll(tipo: TipoPdmType, filters: FilterSubTemaDto) {
        const pdmId = filters.pdm_id;

        const listActive = await this.prisma.subTema.findMany({
            where: {
                pdm_id: pdmId,
                id: filters.id,
                pdm: { tipo: PdmModoParaTipo(tipo), id: pdmId },
                removido_em: null,
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

    async update(tipo: TipoPdmType, id: number, dto: UpdateSubTemaDto, user: PessoaFromJwt) {
        delete dto.pdm_id; // nao deixa editar o PDM

        const self = await this.prisma.subTema.findFirstOrThrow({
            where: { id },
            select: { pdm_id: true },
        });
        await this.pdmService.getDetail(tipo, self.pdm_id, user, 'ReadWrite');

        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.descricao) {
                    const descricaoExists = await prismaTx.subTema.count({
                        where: {
                            pdm_id: self.pdm_id,
                            pdm: { tipo: PdmModoParaTipo(tipo), id: dto.pdm_id },
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

                const subTema = await this.prisma.subTema.update({
                    where: { id: id, pdm: { tipo: PdmModoParaTipo(tipo) } },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...dto,
                    },
                    select: { id: true },
                });

                return subTema;
            }
        );

        return updated;
    }

    async remove(tipo: TipoPdmType, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.subTema.findFirstOrThrow({
            where: { id },
            select: { pdm_id: true },
        });
        await this.pdmService.getDetail(tipo, self.pdm_id, user, 'ReadWrite');

        const emUso = await this.prisma.meta.count({
            where: {
                macro_tema_id: id,
                pdm: { tipo: PdmModoParaTipo(tipo) },
                removido_em: null,
            },
        });
        if (emUso > 0) throw new HttpException('Tema em uso em Metas.', 400);

        const created = await this.prisma.subTema.updateMany({
            where: { id: id, pdm: { tipo: PdmModoParaTipo(tipo) } },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
