import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { CronogramaEtapaNivel, Prisma, TipoPdm } from '@prisma/client';
import { DateTime } from 'luxon';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { SYSTEM_TIMEZONE } from '../common/date2ymd';
import { ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { GeoLocService } from '../geo-loc/geo-loc.service';
import { MetaService } from '../meta/meta.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';
import { CECronogramaEtapaDto, CronogramaEtapaAtrasoGrau } from './entities/cronograma-etapa.entity';

class NivelOrdemForUpsert {
    nivel: CronogramaEtapaNivel;
    ordem: number;
}
@Injectable()
export class CronogramaEtapaService {
    private readonly logger = new Logger(CronogramaEtapaService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly geolocService: GeoLocService,
        @Inject(forwardRef(() => MetaService))
        private readonly metaService: MetaService
    ) {}

    async findAll(
        tipo: TipoPdm,
        filters: FilterCronogramaEtapaDto,
        user: PessoaFromJwt,
        desligaAssertMeta: boolean
    ): Promise<CECronogramaEtapaDto[]> {
        this.logger.debug('findAll');
        // ainda bem que só da pra filtrar uma cronograma/meta por vez, assim reduz a complexidade da validação

        const cronogramaId = filters.cronograma_id;
        if (!desligaAssertMeta) {
            this.logger.debug('assertMetaForCronograma');
            await this.assertMetaForCronograma(tipo, cronogramaId, user, 'readonly');
        }

        const etapaId = filters.etapa_id;
        const inativo = filters.inativo;

        if (filters && filters.cronograma_etapa_ids && etapaId) {
            if (filters.cronograma_etapa_ids.includes(etapaId)) {
                filters.cronograma_etapa_ids = [etapaId];
            } else {
                filters.cronograma_etapa_ids = [-1];
            }
        }

        const cronogramaEtapas = await this.prisma.cronogramaEtapa.findMany({
            where: {
                cronograma_id: cronogramaId,
                etapa_id: filters && filters.cronograma_etapa_ids ? { in: filters.cronograma_etapa_ids } : etapaId,
                inativo: inativo,
                etapa: { removido_em: null },
            },
            select: {
                id: true,
                cronograma_id: true,
                etapa_id: true,
                inativo: true,
                ordem: true,

                cronograma: {
                    select: {
                        inicio_previsto: true,
                        inicio_real: true,
                        termino_previsto: true,
                        termino_real: true,
                    },
                },

                etapa: {
                    select: {
                        id: true,
                        etapa_pai_id: true,
                        peso: true,
                        percentual_execucao: true,
                        n_filhos_imediatos: true,
                        regiao_id: true,
                        nivel: true,
                        descricao: true,
                        inicio_previsto: true,
                        termino_previsto: true,
                        inicio_real: true,
                        termino_real: true,
                        prazo_inicio: true,
                        prazo_termino: true,
                        titulo: true,
                        endereco_obrigatorio: true,
                        responsaveis: {
                            select: {
                                pessoa: {
                                    select: {
                                        id: true,
                                        nome_exibicao: true,
                                    },
                                },
                            },
                        },
                        PdmPerfil: {
                            where: { removido_em: null },
                            select: { equipe_id: true, tipo: true },
                        },
                        variavel: { select: { id: true, codigo: true, titulo: true } },
                        cronograma: {
                            select: {
                                id: true,
                                meta_id: true,
                                iniciativa_id: true,
                                atividade_id: true,
                                descricao: true,

                                meta: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,
                                    },
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,

                                        meta: {
                                            select: {
                                                id: true,
                                                titulo: true,
                                                codigo: true,
                                            },
                                        },
                                    },
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,

                                        iniciativa: {
                                            select: {
                                                id: true,
                                                titulo: true,
                                                codigo: true,

                                                meta: {
                                                    select: {
                                                        id: true,
                                                        titulo: true,
                                                        codigo: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },

                        etapa_filha: {
                            where: {
                                removido_em: null,
                            },
                            select: {
                                id: true,
                                etapa_pai_id: true,
                                regiao_id: true,
                                nivel: true,
                                peso: true,
                                percentual_execucao: true,
                                n_filhos_imediatos: true,
                                descricao: true,
                                inicio_previsto: true,
                                termino_previsto: true,
                                inicio_real: true,
                                termino_real: true,
                                prazo_inicio: true,
                                prazo_termino: true,
                                titulo: true,
                                endereco_obrigatorio: true,
                                responsaveis: {
                                    select: {
                                        pessoa: {
                                            select: {
                                                id: true,
                                                nome_exibicao: true,
                                            },
                                        },
                                    },
                                },
                                PdmPerfil: {
                                    where: { removido_em: null },
                                    select: { equipe_id: true, tipo: true },
                                },
                                variavel: { select: { id: true, codigo: true, titulo: true } },
                                CronogramaEtapa: {
                                    orderBy: { ordem: 'asc' },
                                },

                                etapa_filha: {
                                    where: {
                                        removido_em: null,
                                    },
                                    select: {
                                        id: true,
                                        etapa_pai_id: true,
                                        regiao_id: true,
                                        peso: true,
                                        percentual_execucao: true,
                                        n_filhos_imediatos: true,
                                        nivel: true,
                                        descricao: true,
                                        inicio_previsto: true,
                                        termino_previsto: true,
                                        inicio_real: true,
                                        termino_real: true,
                                        prazo_inicio: true,
                                        prazo_termino: true,
                                        titulo: true,
                                        endereco_obrigatorio: true,
                                        responsaveis: {
                                            select: {
                                                pessoa: {
                                                    select: {
                                                        id: true,
                                                        nome_exibicao: true,
                                                    },
                                                },
                                            },
                                        },
                                        PdmPerfil: {
                                            where: { removido_em: null },
                                            select: { equipe_id: true, tipo: true },
                                        },
                                        variavel: { select: { id: true, codigo: true, titulo: true } },
                                        CronogramaEtapa: {
                                            orderBy: { ordem: 'asc' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: [{ ordem: 'asc' }],
            relationLoadStrategy: 'query',
        });

        const ret: CECronogramaEtapaDto[] = [];

        const etapasIds: number[] = [];
        const equipesIds: number[] = [];
        for (const cronogramaEtapa of cronogramaEtapas) {
            etapasIds.push(cronogramaEtapa.etapa.id);

            for (const perfil of cronogramaEtapa.etapa.PdmPerfil) {
                equipesIds.push(perfil.equipe_id);
            }

            for (const fase of cronogramaEtapa.etapa.etapa_filha) {
                etapasIds.push(fase.id);

                for (const perfil of fase.PdmPerfil) {
                    equipesIds.push(perfil.equipe_id);
                }

                for (const subFase of cronogramaEtapa.etapa.etapa_filha) {
                    etapasIds.push(subFase.id);

                    for (const perfil of subFase.PdmPerfil) {
                        equipesIds.push(perfil.equipe_id);
                    }
                }
            }
        }
        const geoDto = new ReferenciasValidasBase();
        geoDto.etapa_id = etapasIds;
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

        for (const cronogramaEtapa of cronogramaEtapas) {
            if (cronogramaEtapa.etapa.etapa_pai_id) {
                const firstLevelParentIndex = cronogramaEtapas
                    .map((e) => e.etapa_id)
                    .indexOf(cronogramaEtapa.etapa.etapa_pai_id);
                if (firstLevelParentIndex >= 0) continue;
            }

            const atrasoCronograma = await this.getAtraso(
                cronogramaEtapa.cronograma.inicio_previsto,
                cronogramaEtapa.cronograma.inicio_real,
                cronogramaEtapa.cronograma.termino_previsto,
                cronogramaEtapa.cronograma.termino_real
            );
            const atrasoCronogramaGrau = await this.getAtrasoGrau(atrasoCronograma);

            const atrasoEtapa = await this.getAtraso(
                cronogramaEtapa.etapa.inicio_previsto,
                cronogramaEtapa.etapa.inicio_real,
                cronogramaEtapa.etapa.termino_previsto,
                cronogramaEtapa.etapa.termino_real
            );
            const atrasoEtapaGrau = await this.getAtrasoGrau(atrasoEtapa);

            ret.push({
                id: cronogramaEtapa.id,
                cronograma_id: cronogramaEtapa.cronograma_id,
                etapa_id: cronogramaEtapa.etapa_id,
                inativo: cronogramaEtapa.inativo,
                ordem: cronogramaEtapa.ordem,
                atraso: atrasoCronograma,
                atraso_grau: atrasoCronogramaGrau,

                etapa: {
                    CronogramaEtapa: [
                        {
                            id: cronogramaEtapa.id,
                            cronograma_id: cronogramaEtapa.cronograma_id,
                            ordem: cronogramaEtapa.ordem,
                        },
                    ],
                    ps_ponto_focal: {
                        equipes: cronogramaEtapa.etapa.PdmPerfil.filter((r) => r.tipo == 'PONTO_FOCAL').map(
                            (r) => r.equipe_id
                        ),
                    },
                    id: cronogramaEtapa.etapa.id,
                    etapa_id: cronogramaEtapa.etapa.id,
                    etapa_pai_id: cronogramaEtapa.etapa.etapa_pai_id,
                    regiao_id: cronogramaEtapa.etapa.regiao_id,
                    nivel: cronogramaEtapa.etapa.nivel,
                    descricao: cronogramaEtapa.etapa.descricao,
                    inicio_previsto: cronogramaEtapa.etapa.inicio_previsto,
                    termino_previsto: cronogramaEtapa.etapa.termino_previsto,
                    inicio_real: cronogramaEtapa.etapa.inicio_real,
                    termino_real: cronogramaEtapa.etapa.termino_real,
                    prazo_inicio: cronogramaEtapa.etapa.prazo_inicio,
                    prazo_termino: cronogramaEtapa.etapa.prazo_termino,
                    titulo: cronogramaEtapa.etapa.titulo,
                    peso: cronogramaEtapa.etapa.peso,
                    percentual_execucao: cronogramaEtapa.etapa.percentual_execucao,
                    ordem: cronogramaEtapa.ordem,
                    n_filhos_imediatos: cronogramaEtapa.etapa.n_filhos_imediatos,
                    endereco_obrigatorio: cronogramaEtapa.etapa.endereco_obrigatorio,

                    // Cálculo de duração e atraso
                    duracao: await this.getDuracao(
                        cronogramaEtapa.etapa.inicio_real,
                        cronogramaEtapa.etapa.termino_real
                    ),
                    atraso: atrasoEtapa,
                    atraso_grau: atrasoEtapaGrau,

                    responsaveis: cronogramaEtapa.etapa.responsaveis.map((r) => {
                        return {
                            id: r.pessoa.id,
                            nome_exibicao: r.pessoa.nome_exibicao,
                        };
                    }),

                    geolocalizacao: geolocalizacao.get(cronogramaEtapa.etapa.id) || [],
                    variavel: cronogramaEtapa.etapa.variavel,
                    etapa_filha: await Promise.all(
                        cronogramaEtapa.etapa.etapa_filha.map(async (f) => {
                            const atrasoFase = await this.getAtraso(
                                f.inicio_previsto,
                                f.inicio_real,
                                f.termino_previsto,
                                f.termino_real
                            );
                            const atrasoFaseGrau = await this.getAtrasoGrau(atrasoFase);

                            return {
                                ps_ponto_focal: {
                                    equipes: f.PdmPerfil.filter((r) => r.tipo == 'PONTO_FOCAL').map((r) => r.equipe_id),
                                },

                                CronogramaEtapa: f.CronogramaEtapa.map((x) => {
                                    return {
                                        id: x.id,
                                        cronograma_id: x.cronograma_id,
                                        ordem: x.ordem,
                                    };
                                }),

                                id: f.id,
                                etapa_id: f.id,
                                geolocalizacao: geolocalizacao.get(f.id) || [],
                                etapa_pai_id: f.etapa_pai_id,
                                regiao_id: f.regiao_id,
                                nivel: f.nivel,
                                descricao: f.descricao,
                                inicio_previsto: f.inicio_previsto,
                                termino_previsto: f.termino_previsto,
                                inicio_real: f.inicio_real,
                                termino_real: f.termino_real,
                                prazo_inicio: f.prazo_inicio,
                                prazo_termino: f.prazo_termino,
                                titulo: f.titulo,
                                peso: f.peso,
                                percentual_execucao: f.percentual_execucao,
                                ordem: f.CronogramaEtapa[0].ordem,
                                n_filhos_imediatos: f.n_filhos_imediatos,
                                duracao: await this.getDuracao(f.inicio_real, f.termino_real),
                                atraso: atrasoFase,
                                atraso_grau: atrasoFaseGrau,
                                endereco_obrigatorio: f.endereco_obrigatorio,
                                responsaveis: f.responsaveis.map((r) => {
                                    return {
                                        id: r.pessoa.id,
                                        nome_exibicao: r.pessoa.nome_exibicao,
                                    };
                                }),
                                variavel: f.variavel,
                                etapa_filha: await Promise.all(
                                    f.etapa_filha.map(async (ff) => {
                                        const atrasoSubFase = await this.getAtraso(
                                            ff.inicio_previsto,
                                            ff.inicio_real,
                                            ff.termino_previsto,
                                            ff.termino_real
                                        );
                                        const atrasoSubFaseGrau = await this.getAtrasoGrau(atrasoSubFase);
                                        return {
                                            ps_ponto_focal: {
                                                equipes: ff.PdmPerfil.filter((r) => r.tipo == 'PONTO_FOCAL').map(
                                                    (r) => r.equipe_id
                                                ),
                                            },
                                            CronogramaEtapa: ff.CronogramaEtapa.map((x) => {
                                                return { id: x.id, cronograma_id: x.cronograma_id, ordem: x.ordem };
                                            }),

                                            id: ff.id,
                                            geolocalizacao: geolocalizacao.get(ff.id) || [],
                                            etapa_id: ff.id,
                                            etapa_pai_id: ff.etapa_pai_id,
                                            regiao_id: ff.regiao_id,
                                            nivel: ff.nivel,
                                            descricao: ff.descricao,
                                            inicio_previsto: ff.inicio_previsto,
                                            termino_previsto: ff.termino_previsto,
                                            inicio_real: ff.inicio_real,
                                            termino_real: ff.termino_real,
                                            prazo_inicio: ff.prazo_inicio,
                                            prazo_termino: ff.prazo_termino,
                                            titulo: ff.titulo,
                                            peso: ff.peso,
                                            percentual_execucao: ff.percentual_execucao,
                                            n_filhos_imediatos: ff.n_filhos_imediatos,
                                            ordem: ff.CronogramaEtapa[0].ordem,
                                            duracao: await this.getDuracao(ff.inicio_real, ff.termino_real),
                                            atraso: atrasoSubFase,
                                            atraso_grau: atrasoSubFaseGrau,
                                            endereco_obrigatorio: ff.endereco_obrigatorio,
                                            variavel: ff.variavel,
                                            responsaveis: ff.responsaveis.map((r) => {
                                                return {
                                                    id: r.pessoa.id,
                                                    nome_exibicao: r.pessoa.nome_exibicao,
                                                };
                                            }),
                                        };
                                    })
                                ),
                            };
                        })
                    ),
                },

                cronograma_origem_etapa: {
                    ...cronogramaEtapa.etapa.cronograma,
                },
            });
        }

        return await this.sortReturn(ret);
    }

    private async sortReturn(ret_arr: CECronogramaEtapaDto[]): Promise<CECronogramaEtapaDto[]> {
        ret_arr.sort((a, b) => a.ordem - b.ordem);
        ret_arr.forEach((r) => {
            if (r.etapa?.etapa_filha && r.etapa.etapa_filha.length > 0) {
                r.etapa.etapa_filha.sort((a, b) => a.ordem - b.ordem);

                r.etapa.etapa_filha.forEach((rr) => {
                    if (rr.etapa_filha && rr.etapa_filha.length > 0) {
                        rr.etapa_filha.sort((a, b) => a.ordem - b.ordem);
                    }
                });
            }
        });

        return ret_arr;
    }

    async update(
        tipo: TipoPdm,
        dto: UpdateCronogramaEtapaDto,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient
    ) {
        await this.assertMetaForCronograma(tipo, dto.cronograma_id, user);

        if (dto.ordem && dto.ordem <= 0) dto.ordem = 1;

        const performUpdate = async (prismaTx: Prisma.TransactionClient): Promise<number> => {
            const self = await prismaTx.cronogramaEtapa.findFirst({
                where: {
                    cronograma_id: dto.cronograma_id,
                    etapa_id: dto.etapa_id,
                },
                select: {
                    nivel: true,
                    ordem: true,
                    etapa: {
                        select: {
                            etapa_pai_id: true,
                        },
                    },
                },
            });

            const selfExiste: boolean = self ? true : false;
            const nivelOrdemForUpsert: NivelOrdemForUpsert = await this.getNivelOrdemForUpsert(
                selfExiste,
                dto.ordem,
                dto.cronograma_id,
                dto.etapa_id,
                prismaTx
            );
            const rowMaxOrdem = await prismaTx.cronogramaEtapa.findFirst({
                where: {
                    cronograma_id: dto.cronograma_id,
                    nivel: nivelOrdemForUpsert.nivel,
                },
                select: { ordem: true },
                orderBy: { ordem: 'desc' },
                take: 1,
            });
            const maxOrdem: number = rowMaxOrdem ? rowMaxOrdem.ordem : nivelOrdemForUpsert.ordem;
            const ordemUtilizada = dto.ordem && dto.ordem <= maxOrdem ? dto.ordem : nivelOrdemForUpsert.ordem;
            //this.logger.debug('===========================');
            //this.logger.debug('dto.ordem = ' + dto.ordem);
            //this.logger.debug('maxOrdem = ' + maxOrdem);
            //this.logger.debug('self : ');
            //this.logger.debug(self);
            //this.logger.debug('selfExiste = ' + selfExiste);
            //this.logger.debug('nivelOrdemForUpsert : ');
            //this.logger.debug(nivelOrdemForUpsert);
            //this.logger.debug('ordemUtilizada = ' + ordemUtilizada);
            //this.logger.debug('===========================');

            const cronogramaEtapa = await prismaTx.cronogramaEtapa.upsert({
                where: {
                    CronogramaEtapaUniq: {
                        cronograma_id: dto.cronograma_id,
                        etapa_id: dto.etapa_id,
                    },
                },
                update: {
                    ordem: ordemUtilizada,
                    inativo: dto.inativo,
                },
                create: {
                    ...dto,
                    nivel: nivelOrdemForUpsert.nivel,
                    ordem: ordemUtilizada,
                },
                select: { id: true, ordem: true, nivel: true, etapa: { select: { etapa_pai_id: true } } },
            });

            if (dto.ordem && ((self && dto.ordem != self.ordem) || (!self && dto.ordem != nivelOrdemForUpsert.ordem))) {
                const rows = await prismaTx.cronogramaEtapa.findMany({
                    where: {
                        cronograma_id: dto.cronograma_id,
                        nivel: cronogramaEtapa.nivel,
                        id: { not: cronogramaEtapa.id },
                        etapa: {
                            etapa_pai_id: cronogramaEtapa.etapa.etapa_pai_id,
                        },
                    },
                    select: {
                        id: true,
                        ordem: true,
                    },
                    orderBy: { ordem: 'asc' },
                });

                const updates = [];
                let startOrdem = self ? self.ordem : Number.MAX_VALUE;
                let endOrdem = ordemUtilizada;

                if (startOrdem > endOrdem) {
                    [startOrdem, endOrdem] = [endOrdem, startOrdem];
                }

                for (const row of rows) {
                    if (row.ordem >= startOrdem && row.ordem <= endOrdem) {
                        let newOrdem;
                        //this.logger.debug('=======================');
                        //this.logger.debug('rowOrdem = ' + row.ordem);

                        if (
                            (self && ordemUtilizada < self.ordem) ||
                            (!self && (ordemUtilizada == row.ordem || ordemUtilizada < row.ordem)) ||
                            (self && self.ordem - ordemUtilizada != -1 && self.ordem - ordemUtilizada > -2)
                        ) {
                            //this.logger.debug('ordem irá subir');
                            newOrdem = row.ordem + 1;
                        } else {
                            //this.logger.debug('ordem irá descer');
                            newOrdem = row.ordem - 1;
                            if (newOrdem <= 0) break;
                        }
                        //this.logger.debug('=======================');

                        updates.push(
                            prismaTx.cronogramaEtapa.update({
                                where: { id: row.id },
                                data: { ordem: newOrdem },
                            })
                        );
                    }
                }

                await Promise.all(updates);
            }

            return cronogramaEtapa.id;
        };

        let id;

        if (prismaCtx) {
            id = await performUpdate(prismaCtx);
        } else {
            id = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                return await performUpdate(prisma);
            });
        }

        return { id };
    }

    private async assertMetaForCronograma(
        tipo: TipoPdm,
        cronograma_id: number,
        user: PessoaFromJwt,
        readwrite: 'readonly' | 'readwrite' = 'readwrite'
    ) {
        const r = await this.prisma.view_meta_cronograma.findFirstOrThrow({
            where: { cronograma_id },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow(tipo, r.meta_id, user, 'cronograma', readwrite);
    }

    async getNivelOrdemForUpsert(
        self_existe: boolean,
        ordem_input: number | undefined,
        cronograma_id: number,
        etapa_id: number,
        prismaTx: Prisma.TransactionClient
    ): Promise<NivelOrdemForUpsert> {
        let nivel: CronogramaEtapaNivel;
        let ordem: number;

        const etapa = await prismaTx.etapa.findFirstOrThrow({
            where: { id: etapa_id },
            select: {
                id: true,
                etapa_pai_id: true,
                etapa_pai: {
                    select: {
                        id: true,
                        etapa_pai_id: true,
                    },
                },
            },
        });

        if (!etapa.etapa_pai_id) {
            nivel = CronogramaEtapaNivel.Etapa;
        } else if (etapa.etapa_pai_id && etapa.etapa_pai && !etapa.etapa_pai.etapa_pai_id) {
            nivel = CronogramaEtapaNivel.Fase;
        } else {
            nivel = CronogramaEtapaNivel.SubFase;
        }

        const etapa_pai_id: number | null = etapa.etapa_pai_id;

        const ultimaRow = await prismaTx.cronogramaEtapa.findFirst({
            where: {
                cronograma_id,
                nivel,
                etapa: {
                    etapa_pai_id,
                },
            },
            select: { ordem: true },
            orderBy: { ordem: 'desc' },
            take: 1,
        });

        if (ultimaRow) {
            ordem = ultimaRow.ordem + 1;
        } else {
            ordem = 1;
        }

        return { nivel, ordem };
    }

    async delete(tipo: TipoPdm, cronograma_etapa_id: number, user: PessoaFromJwt) {
        const self = await this.prisma.cronogramaEtapa.findUnique({
            where: { id: cronograma_etapa_id },
            select: {
                cronograma_id: true,
                nivel: true,
                ordem: true,
            },
        });

        if (!self) {
            throw new NotFoundException(`CronogramaEtapa with id ${cronograma_etapa_id} not found`);
        }
        await this.assertMetaForCronograma(tipo, self.cronograma_id, user);

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            await prisma.cronogramaEtapa.delete({
                where: { id: cronograma_etapa_id },
            });

            const rows = await prisma.cronogramaEtapa.findMany({
                where: {
                    cronograma_id: self.cronograma_id,
                    nivel: self.nivel,
                    ordem: { gt: self.ordem },
                },
                select: {
                    id: true,
                    ordem: true,
                },
                orderBy: { ordem: 'asc' },
            });

            const updates = rows.map((row) =>
                prisma.cronogramaEtapa.update({
                    where: { id: row.id },
                    data: { ordem: row.ordem - 1 },
                })
            );

            return Promise.all(updates);
        });

        return self;
    }

    async getDuracao(inicio_real: Date | null, termino_real: Date | null): Promise<string> {
        if (!inicio_real) return '';

        const start: DateTime = DateTime.fromJSDate(inicio_real);
        const end: DateTime = termino_real
            ? DateTime.fromJSDate(termino_real)
            : DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day');

        const duration = end.diff(start).as('days');

        return await this.durationInDaysHuman(duration);
    }

    async getAtraso(
        inicio_previsto: Date | null,
        inicio_real: Date | null,
        termino_previsto: Date | null,
        termino_real: Date | null
    ): Promise<number | null> {
        if (termino_real) return 0;

        const hoje = DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day');

        let diff: number;
        if (inicio_real) {
            if (termino_previsto == null) {
                console.warn(
                    'Row possui inicio_real, mas não possui termino_previsto, cálculo de atraso em relação ao término é impossível.'
                );
                return null;
            }

            diff = hoje.diff(DateTime.fromJSDate(termino_previsto)).as('days');
        } else {
            if (inicio_previsto == null) {
                console.warn('Row não possui inicio_real e nem inicio_previsto. Cálculo de atraso impossível.');
                return null;
            }

            diff = hoje.diff(DateTime.fromJSDate(inicio_previsto)).as('days');
        }

        const atraso = diff <= 0 ? null : Math.floor(Math.abs(diff));
        return atraso;
    }

    async getAtrasoGrau(atraso: number | null): Promise<string> {
        if (atraso == 0) {
            return CronogramaEtapaAtrasoGrau[CronogramaEtapaAtrasoGrau.Concluido];
        } else if (!atraso || (atraso && atraso < 30)) {
            return CronogramaEtapaAtrasoGrau[CronogramaEtapaAtrasoGrau.Neutro];
        } else if (atraso >= 30 && atraso < 60) {
            return CronogramaEtapaAtrasoGrau[CronogramaEtapaAtrasoGrau.Moderado];
        } else {
            return CronogramaEtapaAtrasoGrau[CronogramaEtapaAtrasoGrau.Alto];
        }
    }

    async getAtrasoMaisSevero(cronogramaEtapaRet: CECronogramaEtapaDto[]): Promise<string | null> {
        let atrasoMaisSevero: CronogramaEtapaAtrasoGrau | null = null;
        let comparacao: CronogramaEtapaAtrasoGrau | null = null;
        for (const row of cronogramaEtapaRet) {
            const etapa = row.etapa;

            if (etapa) {
                if (etapa.atraso_grau)
                    atrasoMaisSevero =
                        CronogramaEtapaAtrasoGrau[etapa.atraso_grau as keyof typeof CronogramaEtapaAtrasoGrau];
                if (atrasoMaisSevero && atrasoMaisSevero == CronogramaEtapaAtrasoGrau.Alto) break;

                if (etapa.etapa_filha) {
                    for (const fase of etapa.etapa_filha) {
                        if (fase.atraso_grau) {
                            comparacao =
                                CronogramaEtapaAtrasoGrau[fase.atraso_grau as keyof typeof CronogramaEtapaAtrasoGrau];
                            if (!atrasoMaisSevero || comparacao > atrasoMaisSevero) atrasoMaisSevero = comparacao;
                        }

                        if (atrasoMaisSevero && atrasoMaisSevero == CronogramaEtapaAtrasoGrau.Alto) break;

                        if (fase.etapa_filha) {
                            for (const subfase of fase.etapa_filha) {
                                if (subfase.atraso_grau) {
                                    comparacao =
                                        CronogramaEtapaAtrasoGrau[
                                            subfase.atraso_grau as keyof typeof CronogramaEtapaAtrasoGrau
                                        ];
                                    if (!atrasoMaisSevero || comparacao > atrasoMaisSevero)
                                        atrasoMaisSevero = comparacao;
                                }

                                if (atrasoMaisSevero && atrasoMaisSevero == CronogramaEtapaAtrasoGrau.Alto) break;
                            }
                        }
                    }
                }
            }
        }

        return atrasoMaisSevero ? CronogramaEtapaAtrasoGrau[atrasoMaisSevero] : null;
    }

    async durationInDaysHuman(duration: number | null): Promise<string> {
        if (duration == null) return '';
        duration = Math.ceil(duration);

        if (duration === 1 || duration === 0) {
            return `${duration} dia`;
        }

        return duration + ' dias';
    }
}
