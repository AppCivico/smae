import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEtapaDto } from './dto/create-etapa.dto';
import { FilterEtapaDto } from './dto/filter-etapa.dto';
import { UpdateEtapaDto } from './dto/update-etapa.dto';

@Injectable()
export class EtapaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createEtapaDto: CreateEtapaDto, user: PessoaFromJwt) {

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const etapa = await prisma.etapa.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createEtapaDto,
                },
                select: { id: true }
            });

            const cronogramaId = createEtapaDto.cronograma_id;
            const ordem = createEtapaDto.ordem ? createEtapaDto.ordem : null ;

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
        let etapaPaiId = filters?.etapa_pai_id;
        let regiaoId = filters?.regiao_id;

        return await this.prisma.etapa.findMany({
            where: {
                etapa_pai_id: etapaPaiId,
                regiao_id: regiaoId
            },
            select: {
                id: true,
                etapa_pai_id: true,
                regiao_id: true,
                descricao: true,
                nivel: true,
                prazo: true,
                inicio_previsto: true,
                termino_previsto: true,
                inicio_real: true,
                termino_real: true,
            }
        });
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
