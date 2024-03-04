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
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { GeoLocService } from '../geo-loc/geo-loc.service';

@Injectable()
export class EtapaService {
    private readonly logger = new Logger(EtapaService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cronogramaEtapaService: CronogramaEtapaService,
        private readonly geolocService: GeoLocService
    ) {}

    async create(cronogramaId: number, dto: CreateEtapaDto, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            // logo, é um tecnico_cp
            // TODO buscar o ID da meta pelo cronograma, pra verificar
        }

        const responsaveis = dto.responsaveis || [];

        const ordem: number | undefined = dto.ordem;
        delete dto.ordem;
        delete (dto as any).responsaveis;

        if (dto.inicio_previsto && dto.termino_previsto && dto.inicio_previsto > dto.termino_previsto)
            throw new HttpException('inicio_previsto| Não pode ser maior que termino_previsto', 400);

        if (dto.inicio_real && dto.termino_real && dto.inicio_real > dto.termino_real)
            throw new HttpException('inicio_real| Não pode ser maior que termino_real', 400);

        if (dto.termino_previsto && dto.inicio_previsto && dto.termino_previsto < dto.inicio_previsto)
            throw new HttpException('termino_previsto| Não pode ser menor que inicio_previsto', 400);

        if (dto.termino_real && dto.inicio_real && dto.termino_real < dto.inicio_real)
            throw new HttpException('termino_real| Não pode ser menor que inicio_real', 400);

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const geolocalizacao = dto.geolocalizacao;
                delete dto.geolocalizacao;

                const etapa = await prismaTx.etapa.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,
                        ...dto,
                        cronograma_id: cronogramaId,
                        responsaveis: undefined,
                    },
                    select: { id: true },
                });

                await prismaTx.etapaResponsavel.createMany({
                    data: await this.buildEtapaResponsaveis(etapa.id, responsaveis),
                });

                if (geolocalizacao) {
                    const geoDto = new CreateGeoEnderecoReferenciaDto();
                    geoDto.etapa_id = etapa.id;
                    geoDto.tokens = geolocalizacao;
                    geoDto.tipo = 'Endereco';

                    await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);
                }

                // TODO validar a falta do endereço e data de termino, assim como no patch

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

        const geoDto = new ReferenciasValidasBase();
        geoDto.etapa_id = etapas.map((r) => r.id);
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

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
                endereco_obrigatorio: etapa.endereco_obrigatorio,
                geolocalizacao: geolocalizacao.get(etapa.id) || [],
            });
        }

        return ret;
    }

    async update(id: number, dto: UpdateEtapaDto, user: PessoaFromJwt) {
        const responsaveis = dto.responsaveis === null ? [] : dto.responsaveis;
        const geolocalizacao = dto.geolocalizacao;
        delete dto.geolocalizacao;

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const self = await prismaTx.etapa.findFirstOrThrow({
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
                        select: { id: true },
                    },

                    // Por agora pegando apenas uma única row de cronograma
                    // No entanto, o sistema foi construído com a possibilidade
                    // de uma etapa estar em N cronogramas.
                    CronogramaEtapa: {
                        take: 1,
                        where: {
                            etapa_id: id,
                            inativo: false,
                        },
                        select: { cronograma_id: true },
                    },
                },
            });

            if (
                self.n_filhos_imediatos &&
                dto.percentual_execucao &&
                dto.percentual_execucao != self.percentual_execucao
            )
                throw new HttpException('percentual_execucao| Não pode ser enviado pois há dependentes.', 400);

            if (
                self.n_filhos_imediatos &&
                ((dto.inicio_previsto && dto.inicio_previsto.getTime() != self.inicio_previsto?.getTime()) ||
                    (dto.inicio_real && dto.inicio_real.getTime() != self.inicio_real?.getTime()) ||
                    (dto.termino_previsto && dto.termino_previsto.getTime() != self.termino_previsto?.getTime()) ||
                    (dto.termino_real && dto.termino_real.getTime() != self.termino_real?.getTime()))
            )
                throw new HttpException('Datas não podem ser modificadas pois há dependentes.', 400);

            const terminoPrevisto: Date | null = dto.termino_previsto ? dto.termino_previsto : self.termino_previsto;
            if (dto.inicio_previsto && terminoPrevisto && dto.inicio_previsto > terminoPrevisto)
                throw new HttpException('inicio_previsto| Não pode ser maior que termino_previsto', 400);

            const terminoReal: Date | null = dto.termino_real ? dto.termino_real : self.termino_real;
            if (dto.inicio_real && terminoReal && dto.inicio_real > terminoReal)
                throw new HttpException('inicio_real| Não pode ser maior que termino_real', 400);

            const inicioPrevisto: Date | null = dto.inicio_previsto ? dto.inicio_previsto : self.inicio_previsto;
            if (dto.termino_previsto && inicioPrevisto && dto.termino_previsto < inicioPrevisto)
                throw new HttpException('termino_previsto| Não pode ser menor que inicio_previsto', 400);

            const inicioReal: Date | null = dto.inicio_real ? dto.inicio_real : self.inicio_real;
            if (dto.termino_real && inicioReal && dto.termino_real < inicioReal)
                throw new HttpException('termino_real| Não pode ser menor que inicio_real', 400);
            if (
                self.endereco_obrigatorio &&
                self.termino_real &&
                geolocalizacao !== undefined &&
                geolocalizacao.length === 0 &&
                self.GeoLocalizacaoReferencia.length > 0
            )
                throw new HttpException(
                    'Endereços não podem ser removidos, pois a tarefa já foi concluída e o endereço é obrigatório.',
                    400
                );

            if (geolocalizacao) {
                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.etapa_id = id;
                geoDto.tokens = geolocalizacao;
                geoDto.tipo = 'Endereco';

                await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);
            }

            const etapaAtualizada = await prismaTx.etapa.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: now,
                    ...dto,
                    responsaveis: undefined,
                },
                select: {
                    id: true,
                    termino_real: true,
                    endereco_obrigatorio: true,
                    GeoLocalizacaoReferencia: {
                        where: { removido_em: null },
                        select: { id: true },
                    },
                },
            });

            if (Array.isArray(responsaveis)) {
                const currentVersion = self.responsaveis.map((r) => r.pessoa_id).join(',');
                const newVersionStr = responsaveis.sort((a, b) => a - b).join(',');

                if (currentVersion !== newVersionStr) {
                    this.logger.debug(`responsaveis mudaram: old ${currentVersion} !== new ${newVersionStr}`);
                    const promises = [];
                    for (const responsavel of responsaveis) {
                        promises.push(
                            prismaTx.etapaResponsavel.upsert({
                                where: {
                                    etapa_pessoa_uniq: {
                                        pessoa_id: responsavel,
                                        etapa_id: etapaAtualizada.id,
                                    },
                                },
                                create: {
                                    pessoa_id: responsavel,
                                    etapa_id: etapaAtualizada.id,
                                },
                                update: {},
                            })
                        );
                    }
                    await Promise.all(promises);
                } else {
                    this.logger.debug(
                        `responsaveis continuam iguais, o banco não será chamado para evitar o recálculo do trigger`
                    );
                }
            }

            // apaga tudo por enquanto, não só as que têm algum crono dessa meta
            await prismaTx.statusMetaCicloFisico.deleteMany();

            // Boolean de controle de endereço:
            // Caso seja true, a etapa só pode receber a data de termino_real
            // Se possuir endereço, ou seja, rows de GeoLocalizacaoReferencia
            if (
                etapaAtualizada.endereco_obrigatorio &&
                etapaAtualizada.GeoLocalizacaoReferencia.length === 0 &&
                etapaAtualizada.termino_real !== null
            )
                throw new HttpException('Endereço é obrigatório para adicionar a data de término.', 400);

            // Esta func verifica se as rows acima (etapa_pai_id) possuem esse boolean "endereco_obrigatorio"
            // E se está sendo respeitado
            if (dto.termino_real && dto.termino_real !== null) {
                const paisComPendencias: { assert_geoloc_rule: string }[] =
                    await prismaTx.$queryRaw`SELECT CAST(assert_geoloc_rule(${id}::integer, ${self.CronogramaEtapa[0].cronograma_id}::integer) AS VARCHAR)`;
                if (paisComPendencias[0].assert_geoloc_rule && paisComPendencias[0].assert_geoloc_rule !== null) {
                    const pendentesStr = paisComPendencias[0].assert_geoloc_rule.slice(1, -1);
                    const pendentes = pendentesStr.split(',').filter((e) => e.length > 1);

                    if (pendentes.length > 0)
                        throw new HttpException(
                            `Seguintes etapas precisam ter o endereço preenchido: ${pendentes.join(',')}`,
                            400
                        );
                }
            }

            return etapaAtualizada;
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
