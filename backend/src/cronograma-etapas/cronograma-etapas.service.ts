import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { create } from 'domain';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FilterCronogramaEtapaDto } from 'src/cronograma-etapas/dto/filter-cronograma-etapa.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import { UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';
import { CronogramaEtapa } from './entities/cronograma-etapa.entity';

@Injectable()
export class CronogramaEtapaService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filters: FilterCronogramaEtapaDto | undefined = undefined) {
        let cronogramaId = filters!.cronograma_id;

        let etapaId = filters?.etapa_id;
        let inativo = filters?.inativo;

        let ret: CronogramaEtapa[] = [];

        if (filters && filters.cronograma_etapa_ids && etapaId) {
            if (filters.cronograma_etapa_ids.includes(etapaId)) {
                filters.cronograma_etapa_ids = [etapaId]
            } else {
                filters.cronograma_etapa_ids = [-1];
            }
        }

        const cronogramaEtapas = await this.prisma.cronogramaEtapa.findMany({
            where: {
                cronograma_id: cronogramaId,
                etapa_id: filters && filters.cronograma_etapa_ids ? { in: filters.cronograma_etapa_ids } : etapaId,
                inativo: inativo,
            },
            select: {
                id: true,
                cronograma_id: true,
                etapa_id: true,
                inativo: true,
                ordem: true,

                etapa: {
                    select: {
                        id: true,
                        etapa_pai_id: true,
                        regiao_id: true,
                        nivel: true,
                        descricao: true,
                        inicio_previsto: true,
                        termino_previsto: true,
                        inicio_real: true,
                        termino_real: true,
                        prazo: true,
                        titulo: true,

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
                                        codigo: true
                                    }
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
                                            }
                                        }
                                    }
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
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },

                        etapa_filha: {
                            select: {
                                id: true,
                                etapa_pai_id: true,
                                regiao_id: true,
                                nivel: true,
                                descricao: true,
                                inicio_previsto: true,
                                termino_previsto: true,
                                inicio_real: true,
                                termino_real: true,
                                prazo: true,
                                titulo: true,
                                CronogramaEtapa: {
                                    orderBy: { ordem: 'asc' }
                                },

                                etapa_filha: {
                                    select: {
                                        id: true,
                                        etapa_pai_id: true,
                                        regiao_id: true,
                                        nivel: true,
                                        descricao: true,
                                        inicio_previsto: true,
                                        termino_previsto: true,
                                        inicio_real: true,
                                        termino_real: true,
                                        prazo: true,
                                        titulo: true,

                                        CronogramaEtapa: {
                                            orderBy: { ordem: 'asc' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: [
                { ordem: 'asc' }
            ]
        });

        let lastOrdemVal = 0;
        for (const cronogramaEtapa of cronogramaEtapas) {

            if (cronogramaEtapa.etapa.etapa_pai_id) {
                const firstLevelParentIndex = cronogramaEtapas.map(e => e.etapa_id).indexOf(cronogramaEtapa.etapa.etapa_pai_id);
                if (firstLevelParentIndex >= 0) continue;
            }

            let ordem;
            if (cronogramaEtapa.ordem) {
                lastOrdemVal = ordem = cronogramaEtapa.ordem;
            } else {
                lastOrdemVal = ordem = lastOrdemVal + 1;
            }

            ret.push({
                id: cronogramaEtapa.id,
                cronograma_id: cronogramaEtapa.cronograma_id,
                etapa_id: cronogramaEtapa.etapa_id,
                inativo: cronogramaEtapa.inativo,
                ordem: ordem,

                etapa: {
                    id: cronogramaEtapa.etapa.id,
                    etapa_pai_id: cronogramaEtapa.etapa.etapa_pai_id,
                    regiao_id: cronogramaEtapa.etapa.regiao_id,
                    nivel: cronogramaEtapa.etapa.nivel,
                    descricao: cronogramaEtapa.etapa.descricao,
                    inicio_previsto: cronogramaEtapa.etapa.inicio_previsto,
                    termino_previsto: cronogramaEtapa.etapa.termino_previsto,
                    inicio_real: cronogramaEtapa.etapa.inicio_real,
                    termino_real: cronogramaEtapa.etapa.termino_real,
                    prazo: cronogramaEtapa.etapa.prazo,
                    titulo: cronogramaEtapa.etapa.titulo,
                    etapa_filha: cronogramaEtapa.etapa.etapa_filha
                },

                cronograma_origem_etapa: {
                    ...cronogramaEtapa.etapa.cronograma
                }
            })
        }

        return ret;
    }

    async update(updateCronogoramaEtapaDto: UpdateCronogramaEtapaDto, user: PessoaFromJwt) {

        let id;
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const cronogramaEtapa = await prisma.cronogramaEtapa.upsert({
                where: {
                    CronogramaEtapaUniq: {
                        cronograma_id: updateCronogoramaEtapaDto.cronograma_id,
                        etapa_id: updateCronogoramaEtapaDto.etapa_id
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
