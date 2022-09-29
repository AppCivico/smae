import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';

@Injectable()
export class CronogramaEtapaService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filters: FilterCronogramaEtapaDto | undefined = undefined) {
        let cronogramaId = filters?.cronograma_id;
        let etapaId = filters?.etapa_id;
        let inativo = filters?.inativo;

        return await this.prisma.cronogramaEtapa.findMany({
            where: {
                cronograma_id: cronogramaId,
                etapa_id: etapaId,
                inativo: inativo,
            },
            select: {
                id: true,
                cronograma_id: true,
                etapa_id: true,
                inativo: true,
                ordem: true
            },
            orderBy: [
                { ordem: 'asc' }
            ]
        });
    }

    async update(id: number, updateCronogoramaEtapaDto: UpdateCronogramaEtapaDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const cronograma = await prisma.cronogramaEtapa.update({
                where: { id: id },
                data: {
                    ...updateCronogoramaEtapaDto,
                },
                select: { id: true }
            });

            return cronograma;
        });

        return { id };
    }



}
