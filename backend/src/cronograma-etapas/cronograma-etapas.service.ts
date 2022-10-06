import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { create } from 'domain';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { RequiredFindParamsDto, UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';

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

    async update(findParams: RequiredFindParamsDto, updateCronogoramaEtapaDto: UpdateCronogramaEtapaDto, user: PessoaFromJwt) {

        let id;
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const cronogramaEtapa = await prisma.cronogramaEtapa.upsert({
                where: {
                    CronogramaEtapaUniq: {
                        cronograma_id: findParams.cronograma_id,
                        etapa_id: findParams.etapa_id
                    }
                },
                update: {
                    ordem: updateCronogoramaEtapaDto.ordem,
                    inativo: updateCronogoramaEtapaDto.inativo
                },
                create: {
                    ...updateCronogoramaEtapaDto,
                },
                select: { id: true }
            });

            id = cronogramaEtapa.id;
            return cronogramaEtapa;
        });

        return { id };
    }



}
