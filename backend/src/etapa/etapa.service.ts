import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtapaDto } from './dto/create-etapa.dto';
import { FilterEtapaDto } from './dto/filter-etapa.dto';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { Etapa } from './entities/etapa.entity';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { UpdateCronogramaEtapaDto } from 'src/cronograma-etapas/dto/update-cronograma-etapa.dto';

@Injectable()
export class EtapaService {
    private readonly logger = new Logger(EtapaService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cronogramaEtapaService: CronogramaEtapaService
    ) {}

    async create(cronogramaId: number, createEtapaDto: CreateEtapaDto, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            // logo, é um tecnico_cp
            // TODO buscar o ID da meta pelo cronograma, pra verificar
        }

        const responsaveis = createEtapaDto.responsaveis || [];

        const ordem: number | undefined = createEtapaDto.ordem;
        delete createEtapaDto.ordem;
        delete (createEtapaDto as any).responsaveis;

        if (
            createEtapaDto.inicio_previsto &&
            createEtapaDto.termino_previsto &&
            createEtapaDto.inicio_previsto > createEtapaDto.termino_previsto
        )
            throw new HttpException('inicio_previsto| Não pode ser maior que termino_previsto', 400);

        if (
            createEtapaDto.inicio_real &&
            createEtapaDto.termino_real &&
            createEtapaDto.inicio_real > createEtapaDto.termino_real
        )
            throw new HttpException('inicio_real| Não pode ser maior que termino_real', 400);

        if (
            createEtapaDto.termino_previsto &&
            createEtapaDto.inicio_previsto &&
            createEtapaDto.termino_previsto < createEtapaDto.inicio_previsto
        )
            throw new HttpException('termino_previsto| Não pode ser menor que inicio_previsto', 400);

        if (
            createEtapaDto.termino_real &&
            createEtapaDto.inicio_real &&
            createEtapaDto.termino_real < createEtapaDto.inicio_real
        )
            throw new HttpException('termino_real| Não pode ser menor que inicio_real', 400);

        const created = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
                const etapa = await prisma.etapa.create({
                    data: {
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        ...createEtapaDto,
                        cronograma_id: cronogramaId,
                        responsaveis: undefined,
                    },
                    select: { id: true },
                });

                await prisma.etapaResponsavel.createMany({
                    data: await this.buildEtapaResponsaveis(etapa.id, responsaveis),
                });

                return etapa;
            }
        );

        const dadosUpsertCronogramaEtapa: UpdateCronogramaEtapaDto = {
            cronograma_id: cronogramaId,
            etapa_id: created.id,
            ordem: ordem,
        };
        await this.cronogramaEtapaService.update(dadosUpsertCronogramaEtapa, user);

        return created;
    }

    async findAll(filters: FilterEtapaDto | undefined = undefined) {
        const ret: Etapa[] = [];

        const etapaPaiId = filters?.etapa_pai_id;
        const regiaoId = filters?.regiao_id;
        const cronogramaId = filters?.cronograma_id;

        const etapas = await this.prisma.etapa.findMany({
            where: {
                etapa_pai_id: etapaPaiId,
                regiao_id: regiaoId,
                cronograma_id: cronogramaId,
                removido_em: null,

                etapa_filha: {
                    some: {
                        cronograma_id: cronogramaId,
                        etapa_filha: {
                            some: {
                                cronograma_id: cronogramaId,
                            },
                        },
                    },
                },
                CronogramaEtapa: {
                    every: {
                        cronograma_id: cronogramaId,
                    },
                },
            },
            include: {
                etapa_filha: {
                    include: {
                        etapa_filha: true,
                    },
                },
                CronogramaEtapa: true,
            },
        });

        for (const etapa of etapas) {
            const cronograma_etapa = etapa.CronogramaEtapa.filter((r) => {
                return r.cronograma_id === cronogramaId;
            });

            ret.push({
                id: etapa.id,
                etapa_pai_id: etapa.etapa_pai_id,
                regiao_id: etapa.regiao_id,
                cronograma_id: etapa.cronograma_id,
                titulo: etapa.titulo,
                descricao: etapa.descricao,
                nivel: etapa.nivel,
                prazo_inicio: etapa.prazo_inicio,
                prazo_termino: etapa.prazo_termino,
                peso: etapa.peso,
                percentual_execucao: etapa.percentual_execucao,
                n_filhos_imediatos: etapa.n_filhos_imediatos,
                inicio_previsto: etapa.inicio_previsto,
                termino_previsto: etapa.termino_previsto,
                inicio_real: etapa.inicio_real,
                termino_real: etapa.termino_real,
                etapa_filha: etapa.etapa_filha,
                ordem: cronograma_etapa[0].ordem,
                endereco_obrigatorio: etapa.endereco_obrigatorio
            });
        }

        return ret;
    }

    async update(id: number, updateEtapaDto: UpdateEtapaDto, user: PessoaFromJwt) {
        const responsaveis = updateEtapaDto.responsaveis === null ? [] : updateEtapaDto.responsaveis;

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const self = await prisma.etapa.findFirstOrThrow({
                where: { id },
                select: {
                    n_filhos_imediatos: true,
                    percentual_execucao: true,
                    inicio_previsto: true,
                    inicio_real: true,
                    termino_previsto: true,
                    termino_real: true,
                    endereco_obrigatorio: true,
                    responsaveis: {
                        select: {
                            pessoa_id: true,
                        },
                        orderBy: { pessoa_id: 'asc' },
                    },
                    GeoLocalizacaoReferencia: {
                        where: { removido_em: null },
                        select: { id: true }
                    }
                },
            });

            if (
                self.n_filhos_imediatos &&
                updateEtapaDto.percentual_execucao &&
                updateEtapaDto.percentual_execucao != self.percentual_execucao
            )
                throw new HttpException('percentual_execucao| Não pode ser enviado pois há dependentes.', 400);

            if (
                self.n_filhos_imediatos &&
                ((updateEtapaDto.inicio_previsto &&
                    updateEtapaDto.inicio_previsto.getTime() != self.inicio_previsto?.getTime()) ||
                    (updateEtapaDto.inicio_real &&
                        updateEtapaDto.inicio_real.getTime() != self.inicio_real?.getTime()) ||
                    (updateEtapaDto.termino_previsto &&
                        updateEtapaDto.termino_previsto.getTime() != self.termino_previsto?.getTime()) ||
                    (updateEtapaDto.termino_real &&
                        updateEtapaDto.termino_real.getTime() != self.termino_real?.getTime()))
            )
                throw new HttpException('Datas não podem ser modificadas pois há dependentes.', 400);
            
            // Boolean de controle de endereço:
            // Caso seja true, a etapa só pode receber a data de termino_real
            // Se possuir endereço, ou seja, rows de GeoLocalizacaoReferencia
            if (self.endereco_obrigatorio && self.GeoLocalizacaoReferencia.length == 0 && updateEtapaDto.termino_real && updateEtapaDto.termino_real != null)
                throw new HttpException('Endereço é obrigatório.', 400);

            const terminoPrevisto: Date | null = updateEtapaDto.termino_previsto
                ? updateEtapaDto.termino_previsto
                : self.termino_previsto;
            if (updateEtapaDto.inicio_previsto && terminoPrevisto && updateEtapaDto.inicio_previsto > terminoPrevisto)
                throw new HttpException('inicio_previsto| Não pode ser maior que termino_previsto', 400);

            const terminoReal: Date | null = updateEtapaDto.termino_real
                ? updateEtapaDto.termino_real
                : self.termino_real;
            if (updateEtapaDto.inicio_real && terminoReal && updateEtapaDto.inicio_real > terminoReal)
                throw new HttpException('inicio_real| Não pode ser maior que termino_real', 400);

            const inicioPrevisto: Date | null = updateEtapaDto.inicio_previsto
                ? updateEtapaDto.inicio_previsto
                : self.inicio_previsto;
            if (updateEtapaDto.termino_previsto && inicioPrevisto && updateEtapaDto.termino_previsto < inicioPrevisto)
                throw new HttpException('termino_previsto| Não pode ser menor que inicio_previsto', 400);

            const inicioReal: Date | null = updateEtapaDto.inicio_real ? updateEtapaDto.inicio_real : self.inicio_real;
            if (updateEtapaDto.termino_real && inicioReal && updateEtapaDto.termino_real < inicioReal)
                throw new HttpException('termino_real| Não pode ser menor que inicio_real', 400);

            const etapa = await prisma.etapa.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateEtapaDto,
                    responsaveis: undefined,
                },
                select: { id: true },
            });

            if (Array.isArray(responsaveis)) {
                const currentVersion = self.responsaveis.map((r) => r.pessoa_id).join(',');
                const newVersionStr = responsaveis.sort((a, b) => a - b).join(',');

                if (currentVersion !== newVersionStr) {
                    this.logger.debug(`responsaveis mudaram: old ${currentVersion} !== new ${newVersionStr}`);
                    const promises = [];
                    for (const responsavel of responsaveis) {
                        promises.push(
                            prisma.etapaResponsavel.upsert({
                                where: {
                                    etapa_pessoa_uniq: {
                                        pessoa_id: responsavel,
                                        etapa_id: etapa.id,
                                    },
                                },
                                create: {
                                    pessoa_id: responsavel,
                                    etapa_id: etapa.id,
                                },
                                update: {},
                            })
                        );
                    }
                    await Promise.all(promises);
                } else {
                    this.logger.debug(
                        `responsaveis continuam iguais, banco não será chamado para evitar recalc da trigger`
                    );
                }
            }

            // apaga tudo por enquanto, não só as que tem algum crono dessa meta
            await prisma.statusMetaCicloFisico.deleteMany();

            return etapa;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const etapa_has_children = await this.prisma.etapa.count({ where: { etapa_pai_id: id, removido_em: null } });
        if (etapa_has_children) throw new HttpException('Apague primeiro os filhos', 400);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.etapa.updateMany({
                where: { id: id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });

            const cronogramas = await prismaTx.cronogramaEtapa.findMany({
                where: { etapa_id: id },
                select: { id: true },
            });

            for (const cronograma of cronogramas) {
                await this.cronogramaEtapaService.delete(cronograma.id, user);
            }
        });
    }

    async buildEtapaResponsaveis(
        etapaId: number,
        responsaveis: number[]
    ): Promise<Prisma.EtapaResponsavelCreateManyInput[]> {
        const arr: Prisma.EtapaResponsavelCreateManyInput[] = [];
        for (const pessoaId of responsaveis) {
            arr.push({
                etapa_id: etapaId,
                pessoa_id: pessoaId,
            });
        }
        return arr;
    }
}
