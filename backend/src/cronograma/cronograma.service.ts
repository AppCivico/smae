import { Injectable } from '@nestjs/common';
import { Prisma, TipoPdm } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCronogramaDto } from './dto/create-cronograma.dto';
import { FilterCronogramaDto } from './dto/fillter-cronograma.dto';
import { UpdateCronogramaDto } from './dto/update-cronograma.dto';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { MetaService } from '../meta/meta.service';

@Injectable()
export class CronogramaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly metaService: MetaService,
        private readonly cronogramaEtapaService: CronogramaEtapaService
    ) {}

    async create(tipo: TipoPdm, createCronogramaDto: CreateCronogramaDto, user: PessoaFromJwt) {
        if (!createCronogramaDto.meta_id && !createCronogramaDto.atividade_id && !createCronogramaDto.iniciativa_id)
            throw new Error('Cronograma precisa ter 1 relacionamento (Meta, Atividade ou Iniciativa');

        const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
            where: {
                meta_id: createCronogramaDto.meta_id,
                atividade_id: createCronogramaDto.atividade_id,
                iniciativa_id: createCronogramaDto.iniciativa_id,
                pdm: { tipo },
            },
            select: { meta_id: true },
        });

        await this.metaService.assertMetaWriteOrThrow(tipo, metaRow.meta_id, user, 'cronograma');

        const created = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
                const cronograma = await prisma.cronograma.create({
                    data: {
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),

                        ativo: true,
                        meta_id: createCronogramaDto.meta_id,
                        iniciativa_id: createCronogramaDto.iniciativa_id,
                        atividade_id: createCronogramaDto.atividade_id,
                        descricao: createCronogramaDto.descricao,
                        observacao: createCronogramaDto.observacao,
                        regionalizavel: createCronogramaDto.regionalizavel,
                        nivel_regionalizacao: createCronogramaDto.nivel_regionalizacao,
                    },
                    select: { id: true },
                });

                return cronograma;
            }
        );

        return created;
    }

    async findAll(tipo: TipoPdm, filters: FilterCronogramaDto | undefined = undefined, user: PessoaFromJwt) {
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

        // acredito que o sistema usa apenas 1 por vez (atividade, meta ou iniciativa)
        if (rows.length > 10) throw new Error('Filtro muito abrangente, limite de 10 registros');

        const ret = [];
        for (const row of rows) {
            let cronogramaAtraso: string | null = null;

            // a verificação de permissão acaba sendo feita aqui dentro, depois de descobrir qual é a meta
            const cronogramaEtapaRet = await this.cronogramaEtapaService.findAll(
                tipo,
                { cronograma_id: row.id },
                user,
                false
            );
            cronogramaAtraso = await this.cronogramaEtapaService.getAtrasoMaisSevero(cronogramaEtapaRet);

            ret.push({
                ...row,
                atraso_grau: cronogramaAtraso,
            });
        }

        return ret;
    }

    async update(tipo: TipoPdm, id: number, updateCronogoramaDto: UpdateCronogramaDto, user: PessoaFromJwt) {
        const self = await this.prisma.view_meta_cronograma.findFirstOrThrow({
            where: { cronograma_id: id },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow(tipo, self.meta_id, user, 'cronograma');

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const cronograma = await prisma.cronograma.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),

                    ativo: true,
                    descricao: updateCronogoramaDto.descricao,
                    observacao: updateCronogoramaDto.observacao,
                    regionalizavel: updateCronogoramaDto.regionalizavel,
                    nivel_regionalizacao: updateCronogoramaDto.nivel_regionalizacao,
                },
                select: { id: true },
            });

            return cronograma;
        });

        return { id };
    }

    async remove(tipo: TipoPdm, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.view_meta_cronograma.findFirstOrThrow({
            where: { cronograma_id: id },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow(tipo, self.meta_id, user, 'cronograma');

        const removed = await this.prisma.cronograma.updateMany({
            where: { id: id, removido_em: null },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return removed;
    }
}
