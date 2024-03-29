import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCronogramaDto } from './dto/create-cronograma.dto';
import { FilterCronogramaDto } from './dto/fillter-cronograma.dto';
import { UpdateCronogramaDto } from './dto/update-cronograma.dto';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';

@Injectable()
export class CronogramaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cronogramaEtapaService: CronogramaEtapaService
    ) {}

    async create(createCronogramaDto: CreateCronogramaDto, user: PessoaFromJwt) {
        if (!createCronogramaDto.meta_id && !createCronogramaDto.atividade_id && !createCronogramaDto.iniciativa_id)
            throw new Error('Cronograma precisa ter 1 relacionamento (Meta, Atividade ou Iniciativa');

        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            // logo, é um tecnico_cp
            // TODO buscar o ID da meta pelo cronograma, pra verificar
        }

        const created = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
                const cronograma = await prisma.cronograma.create({
                    data: {
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        ...createCronogramaDto,
                    },
                    select: { id: true },
                });

                return cronograma;
            }
        );

        return created;
    }

    async findAll(filters: FilterCronogramaDto | undefined = undefined) {
        const metaId = filters?.meta_id;
        const atividadeId = filters?.atividade_id;
        const iniciativaId = filters?.iniciativa_id;

        const rows = await this.prisma.cronograma.findMany({
            where: {
                meta_id: metaId,
                atividade_id: atividadeId,
                iniciativa_id: iniciativaId,
                removido_em: null,

                CronogramaEtapa:
                    filters && filters.cronograma_etapa_ids
                        ? {
                              some: {
                                  etapa_id: { in: filters.cronograma_etapa_ids },
                              },
                          }
                        : undefined,
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
                percentual_execucao: true,
            },
            orderBy: { criado_em: 'desc' },
        });

        const ret = [];
        for (const row of rows) {
            let cronogramaAtraso: string | null = null;
            const cronogramaEtapaRet = await this.cronogramaEtapaService.findAll({ cronograma_id: row.id });
            cronogramaAtraso = await this.cronogramaEtapaService.getAtrasoMaisSevero(cronogramaEtapaRet);

            ret.push({
                ...row,
                atraso_grau: cronogramaAtraso,
            });
        }

        return ret;
    }

    async update(id: number, updateCronogoramaDto: UpdateCronogramaDto, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            // logo, é um tecnico_cp
            // TODO buscar o ID da meta pelo cronograma, pra verificar
        }

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const cronograma = await prisma.cronograma.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateCronogoramaDto,
                },
                select: { id: true },
            });

            return cronograma;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            // logo, é um tecnico_cp
            // TODO buscar o ID da meta pelo cronograma, pra verificar
        }

        const removed = await this.prisma.cronograma.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return removed;
    }
}
