import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCronogramaDto } from './dto/create-cronograma.dto';
import { FilterCronogramaDto } from './dto/fillter-cronograma.dto';
import { UpdateCronogramaDto } from './dto/update-cronograma.dto';

@Injectable()
export class CronogramaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCronogramaDto: CreateCronogramaDto, user: PessoaFromJwt) {

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            if (!createCronogramaDto.meta_id && !createCronogramaDto.atividade_id && !createCronogramaDto.iniciativa_id)
                throw new Error('Cronograma precisa ter 1 relacionamento (Meta, Atividade ou Iniciativa');

            const cronograma = await prisma.cronograma.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createCronogramaDto,
                },
                select: { id: true }
            });


            return cronograma;
        });

        return created;
    }


    async findAll(filters: FilterCronogramaDto | undefined = undefined) {
        let metaId = filters?.meta_id;
        let atividadeId = filters?.atividade_id;
        let iniciativaId = filters?.iniciativa_id;

        return await this.prisma.cronograma.findMany({
            where: {
                meta_id: metaId,
                atividade_id: atividadeId,
                iniciativa_id: iniciativaId,
                removido_em: null
            },
            select: {
                id: true,
                meta_id: true,
                atividade_id: true,
                iniciativa_id: true,
                descricao: true,
                observacao: true,
                inicio_previsto: true,
                termino_previsto: true,
                inicio_real: true,
                termino_real: true,
                regionalizavel: true,
                nivel_regionalizacao: true,
            }
        });
    }

    async update(id: number, updateCronogoramaDto: UpdateCronogramaDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const cronograma = await prisma.cronograma.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateCronogoramaDto,
                },
                select: { id: true }
            });

            return cronograma;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const removed = await this.prisma.cronograma.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return removed;
    }

}
