import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { create } from 'domain';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCicloFisicoDto } from './dto/create-ciclo-fisico.dto';
import { FilterCicloFisicoDto } from './dto/filter-ciclo-fisico.dto';
import { UpdateCicloFisicoDto } from './dto/update-ciclo-fisico.dto';

@Injectable()
export class CicloFisicoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCicloFisico: CreateCicloFisicoDto, user: PessoaFromJwt) {

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const ciclo_fisico = await prisma.cicloFisico.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createCicloFisico,
                },
                select: { id: true }
            });


            return ciclo_fisico;
        });

        return created;
    }

    async findAll(filters: FilterCicloFisicoDto | undefined = undefined) {
        let pdmId = filters!.pdm_id;

        return await this.prisma.cicloFisico.findMany({
            where: {
                pdm_id: pdmId,
                ativo: true
            },
        });
    }

    async update(id: number, updateCicloFisicoDto: UpdateCicloFisicoDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const ciclo_fisico = await prisma.cicloFisico.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateCicloFisicoDto,
                },
                select: { id: true }
            });

            return ciclo_fisico;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const removed = await this.prisma.cicloFisico.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return removed;
    }

}
