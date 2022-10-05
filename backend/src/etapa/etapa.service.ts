import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEtapaDto } from './dto/create-etapa.dto';
import { FilterEtapaDto } from './dto/filter-etapa.dto';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { Etapa } from './entities/etapa.entity';

@Injectable()
export class EtapaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createEtapaDto: CreateEtapaDto, user: PessoaFromJwt) {

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const cronogramaId = createEtapaDto.cronograma_id;
            const ordem = createEtapaDto.ordem ? createEtapaDto.ordem : null;
            delete createEtapaDto.ordem;

            const etapa = await prisma.etapa.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createEtapaDto,
                },
                select: { id: true }
            });

            await prisma.cronogramaEtapa.create({
                data: {
                    cronograma_id: cronogramaId,
                    etapa_id: etapa.id,
                    ordem: ordem
                }
            })

            return etapa;
        });

        return created;
    }


    async findAll(filters: FilterEtapaDto | undefined = undefined) {
        let ret: Etapa[] = [];

        let etapaPaiId = filters?.etapa_pai_id;
        let regiaoId = filters?.regiao_id;
        let cronogramaId = filters?.cronograma_id;

        let cronogramaRelationFilter;
        if (cronogramaId) {
            cronogramaRelationFilter = {
                CronogramaEtapa: { some: { cronograma_id: cronogramaId } }
            }
        }

        const etapas = await this.prisma.etapa.findMany({
            where: {
                etapa_pai_id: etapaPaiId,
                regiao_id: regiaoId,
                cronograma_id: cronogramaId,
                ...cronogramaRelationFilter,
            },
            include: {
                CronogramaEtapa: {
                    orderBy: {
                        ordem: 'asc'
                    }
                }
            }
        });

        for (const etapa of etapas) {
            const cronogramaEtapa = etapa.CronogramaEtapa[0];
            ret.push({
                id: etapa.id,
                etapa_pai_id: etapa.etapa_pai_id,
                regiao_id: etapa.regiao_id,
                cronograma_id: etapa.cronograma_id,
                titulo: etapa.titulo,
                descricao: etapa.descricao,
                nivel: etapa.nivel,
                prazo: etapa.prazo,
                inicio_previsto: etapa.inicio_previsto,
                termino_previsto: etapa.termino_previsto,
                inicio_real: etapa.inicio_real,
                termino_real: etapa.termino_real,
                ordem: cronogramaEtapa.ordem || null
            })
        }

        return ret
    }

    async update(id: number, updateEtapaDto: UpdateEtapaDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const etapa = await prisma.etapa.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateEtapaDto,
                },
                select: { id: true }
            });

            return etapa;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const removed = await this.prisma.etapa.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return removed;
    }

}
