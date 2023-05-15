import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEixoDto } from './dto/create-eixo.dto';
import { FilterEixoDto } from './dto/filter-eixo.dto';
import { UpdateEixoDto } from './dto/update-eixo.dto';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@Injectable()
export class EixoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createEixoDto: CreateEixoDto, user: PessoaFromJwt) {
        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const descricaoExists = await prismaTx.macroTema.count({
                where: { 
                    pdm_id: createEixoDto.pdm_id,
                    descricao: {
                        equals: createEixoDto.descricao,
                        mode: 'insensitive'   
                    }
                }
            });
            if (descricaoExists) throw new HttpException('descricao| Já existe um Macro Tema com esta descrição.', 400);

            const macroTema = await prismaTx.macroTema.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createEixoDto,
                },
                select: { id: true, descricao: true },
            });

            return macroTema;
        });

        return created;
    }

    async findAll(filters: FilterEixoDto | undefined = undefined) {
        const pdmId = filters?.pdm_id;

        const listActive = await this.prisma.macroTema.findMany({
            where: {
                removido_em: null,
                pdm_id: pdmId,
            },
            select: {
                id: true,
                descricao: true,
                pdm_id: true,
            },
            orderBy: { descricao: 'asc' }
        });
        return listActive;
    }

    async update(id: number, updateEixoDto: UpdateEixoDto, user: PessoaFromJwt) {
        delete updateEixoDto.pdm_id; // nao deixa editar o PDM

        const updated = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            if (updateEixoDto.descricao) {
                const self = await prismaTx.macroTema.findFirstOrThrow({
                    where: { id },
                    select: { pdm_id: true }
                });

                const descricaoExists = await prismaTx.macroTema.count({
                    where: { 
                        pdm_id: self.pdm_id,
                        descricao: {
                            equals: updateEixoDto.descricao,
                            mode: 'insensitive'   
                        }
                    }
                });
                if (descricaoExists) throw new HttpException('descricao| Já existe um Macro Tema com esta descrição.', 400);
            }

            const macroTema = await prismaTx.macroTema.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateEixoDto,
                },
                select: { id: true }
            });

            return macroTema;
        });

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.macroTema.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
