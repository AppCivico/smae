import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { create } from 'domain';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DateTime, Duration } from "luxon";
import { UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';
import { CECronogramaEtapaDto } from './entities/cronograma-etapa.entity';

@Injectable()
export class CronogramaEtapaService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filters: FilterCronogramaEtapaDto | undefined = undefined) {
        let cronogramaId = filters!.cronograma_id;

        let etapaId = filters?.etapa_id;
        let inativo = filters?.inativo;


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
                etapa: { removido_em: null }
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
                        responsaveis: {
                            select: {
                                pessoa: {
                                    select: {
                                        id: true,
                                        nome_exibicao: true
                                    }
                                }
                            }
                        },

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
                            where: {
                                removido_em: null
                            },
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
                                responsaveis: {
                                    select: {
                                        pessoa: {
                                            select: {
                                                id: true,
                                                nome_exibicao: true
                                            }
                                        }
                                    }
                                },
                                CronogramaEtapa: {
                                    orderBy: { ordem: 'asc' }
                                },

                                etapa_filha: {
                                    where: {
                                        removido_em: null
                                    },
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
                                        responsaveis: {
                                            select: {
                                                pessoa: {
                                                    select: {
                                                        id: true,
                                                        nome_exibicao: true
                                                    }
                                                }
                                            }
                                        },

                                        CronogramaEtapa: {
                                            orderBy: { ordem: 'asc' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                }
            },
            orderBy: [
                { ordem: 'asc' }
            ]
        });

        let ret: CECronogramaEtapaDto[] = [];
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
                    CronogramaEtapa: [{
                        id: cronogramaEtapa.id,
                        cronograma_id: cronogramaEtapa.cronograma_id
                    }],

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
                    prazo: cronogramaEtapa.etapa.prazo,
                    titulo: cronogramaEtapa.etapa.titulo,

                    // Cálculo de duração e atraso
                    duracao: await this.getDuracao(cronogramaEtapa.etapa.inicio_real, cronogramaEtapa.etapa.termino_real),
                    atraso: await this.getAtraso(cronogramaEtapa.etapa.termino_previsto, cronogramaEtapa.etapa.termino_real),

                    responsaveis: cronogramaEtapa.etapa.responsaveis.map(r => {
                        return {
                            id: r.pessoa.id,
                            nome_exibicao: r.pessoa.nome_exibicao
                        }
                    }),

                    etapa_filha: await Promise.all( cronogramaEtapa.etapa.etapa_filha.map( async f => {
                        return {
                            CronogramaEtapa: f.CronogramaEtapa.map((x) => { return {
                                id: x.id,
                                cronograma_id: x.cronograma_id
                            }}),

                            id: f.id,
                            etapa_id: f.id,
                            etapa_pai_id: f.etapa_pai_id,
                            regiao_id: f.regiao_id,
                            nivel: f.nivel,
                            descricao: f.descricao,
                            inicio_previsto: f.inicio_previsto,
                            termino_previsto: f.termino_previsto,
                            inicio_real: f.inicio_real,
                            termino_real: f.termino_real,
                            prazo: f.prazo,
                            titulo: f.titulo,
                            duracao: await this.getDuracao(f.inicio_real, f.termino_real),
                            atraso: await this.getAtraso(f.termino_previsto, f.termino_real),

                            responsaveis: f.responsaveis.map(r => {
                                return {
                                    id: r.pessoa.id,
                                    nome_exibicao: r.pessoa.nome_exibicao
                                }
                            }),

                            etapa_filha: await Promise.all( f.etapa_filha.map( async ff => {

                                return {
                                    CronogramaEtapa: ff.CronogramaEtapa.map((x) => { return { id: x.id, cronograma_id: x.cronograma_id } }),

                                    id: ff.id,
                                    etapa_id: ff.id,
                                    etapa_pai_id: ff.etapa_pai_id,
                                    regiao_id: ff.regiao_id,
                                    nivel: ff.nivel,
                                    descricao: ff.descricao,
                                    inicio_previsto: ff.inicio_previsto,
                                    termino_previsto: ff.termino_previsto,
                                    inicio_real: ff.inicio_real,
                                    termino_real: ff.termino_real,
                                    prazo: ff.prazo,
                                    titulo: ff.titulo,
                                    duracao: await this.getDuracao(ff.inicio_real, ff.termino_real),
                                    atraso: await this.getAtraso(ff.termino_previsto, ff.termino_real),

                                    responsaveis: ff.responsaveis.map(r => {
                                        return {
                                            id: r.pessoa.id,
                                            nome_exibicao: r.pessoa.nome_exibicao
                                        }
                                    })
                                }
                            }))
                        }
                        }),
                    )
                    
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

    async delete(id: number, user: PessoaFromJwt) {

        const deleted = await this.prisma.cronogramaEtapa.delete({
            where: { id: id },
        });

        return deleted;
    }

    async getDuracao(inicio_real: Date | null, termino_real: Date | null): Promise<string> {
        if (!inicio_real) return '';

        const start: DateTime = DateTime.fromJSDate(inicio_real);
        const end: DateTime   = termino_real ? ( DateTime.fromJSDate(termino_real) ) : ( DateTime.now() );
        
        const duration: Duration = end.diff(start, 'days');

        return await this.durationInDaysHuman(duration)
    }

    async getAtraso(termino_previsto : Date | null, termino_real: Date | null): Promise<string> {
        if (!termino_real || !termino_previsto) return '';

        const start: DateTime = DateTime.fromJSDate(termino_previsto);
        const end: DateTime   = DateTime.fromJSDate(termino_real);

        const duration: Duration = end.diff(start, 'days');

        return await this.durationInDaysHuman(duration)
    }

    async durationInDaysHuman (duration: Duration): Promise<string> {
        let string_format: string;

        if (duration.days === 1) {
            string_format = "d 'dia'";
        } else if (duration.days <= 0) {
            return ''
        } else {
            string_format = "d 'dias'";
        }

        return duration.toFormat(string_format);
    }

}
