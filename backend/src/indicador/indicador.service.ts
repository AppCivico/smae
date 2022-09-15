import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { FilterIndicadorDto } from './dto/filter-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { Indicador } from './entities/indicador.entity';

@Injectable()
export class IndicadorService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createIndicadorDto: CreateIndicadorDto, user: PessoaFromJwt) {
        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const indicador = await prisma.indicador.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createIndicadorDto,
                },
                select: { id: true }
            });

            return indicador;
        });

        return created;
    }

    async findAll(filters: FilterIndicadorDto | undefined = undefined) {
        let metaId = filters?.meta_id;

        let listActive = await this.prisma.indicador.findMany({
            where: {
                removido_em: null,
                meta_id: metaId,
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                agregador: {
                    select: { id: true, codigo: true }
                },
                janela_agregador: true,
                polaridade: true,
                periodicidade: true,
                regionalizavel: true,
                inicio_medicao: true,
                fim_medicao: true,
                meta_id: true,
            }
        });

        return listActive;
    }

    async update(id: number, updateIndicadorDto: UpdateIndicadorDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const indicador = await prisma.indicador.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),

                    ...updateIndicadorDto,
                },
                select: { id: true }
            });

            return indicador;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.indicador.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }

    async agregadores() {
        return await this.prisma.agregador.findMany({
            select: {
                id: true,
                codigo: true,
                descricao: true
            }
        });
    }
}
