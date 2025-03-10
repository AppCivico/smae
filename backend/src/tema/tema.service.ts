import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PdmModoParaTipo, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { PdmService } from '../pdm/pdm.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObjetivoEstrategicoDto } from './dto/create-tema.dto';
import { FilterObjetivoEstrategicoDto } from './dto/filter-tema.dto';
import { UpdateObjetivoEstrategicoDto } from './dto/update-tema.dto';
import { ObjetivoEstrategicoDto } from './entities/objetivo-estrategico.entity';

@Injectable()
export class TemaService {
    constructor(
        private readonly prisma: PrismaService,
        //
        @Inject(PdmService)
        private readonly pdmService: PdmService
    ) {}

    async create(tipo: TipoPdmType, dto: CreateObjetivoEstrategicoDto, user: PessoaFromJwt) {
        await this.pdmService.getDetail(tipo, dto.pdm_id, user, 'ReadWrite');

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const descricaoExists = await prismaTx.tema.count({
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

    async findAll(tipo: TipoPdmType, filters: FilterObjetivoEstrategicoDto): Promise<ObjetivoEstrategicoDto[]> {
        const pdmId = filters.pdm_id;

        const listActive = await this.prisma.tema.findMany({
            where: {
                removido_em: null,
                id: filters.id,
                pdm_id: pdmId,
                pdm: { tipo: PdmModoParaTipo(tipo), id: pdmId },
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

    async update(tipo: TipoPdmType, id: number, dto: UpdateObjetivoEstrategicoDto, user: PessoaFromJwt) {
        delete dto.pdm_id; // nao deixa editar o PDM
        const self = await this.prisma.tema.findFirstOrThrow({
            where: { id, pdm: { tipo: PdmModoParaTipo(tipo) } },
            select: { pdm_id: true },
        });

        await this.pdmService.getDetail(tipo, self.pdm_id, user, 'ReadWrite');

        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.descricao) {
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
                    where: { id: id, pdm: { tipo: PdmModoParaTipo(tipo) } },
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

    async remove(tipo: TipoPdmType, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.tema.findFirstOrThrow({
            where: { id, pdm: { tipo: PdmModoParaTipo(tipo) } },
            select: { pdm_id: true },
        });
        await this.pdmService.getDetail(tipo, self.pdm_id, user, 'ReadWrite');

        const emUso = await this.prisma.meta.count({
            where: { tema_id: id, removido_em: null, pdm: { tipo: PdmModoParaTipo(tipo) } },
        });
        if (emUso > 0) throw new HttpException('Objetivo Estratégico em uso em Metas.', 400);

        const created = await this.prisma.tema.updateMany({
            where: { id: id, pdm: { tipo: PdmModoParaTipo(tipo) } },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
