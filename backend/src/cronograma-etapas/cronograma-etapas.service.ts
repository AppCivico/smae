import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { create } from 'domain';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterCronogramaEtapaDto } from './dto/filter-cronograma-etapa.dto';
import { RequiredFindParamsDto, UpdateCronogramaEtapaDto } from './dto/update-cronograma-etapa.dto';
import { CronogramaEtapa } from './entities/cronograma-etapa.entity';

@Injectable()
export class CronogramaEtapaService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filters: FilterCronogramaEtapaDto | undefined = undefined) {
        let cronogramaId = filters!.cronograma_id;

        let etapaId = filters?.etapa_id;
        let inativo = filters?.inativo;

        let ret: CronogramaEtapa[] = [];

        const cronogramaEtapas = await this.prisma.cronogramaEtapa.findMany({
            where: {
                cronograma_id: cronogramaId,
                etapa_id: etapaId,
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

                cronograma_origem_etapa: {
                    // id: cronogramaEtapa.etapa.cronograma.id,
                    // meta_id: cronogramaEtapa.etapa.cronograma.meta_id,
                    // iniciativa_id: cronogramaEtapa.etapa.cronograma.iniciativa_id,
                    // atividade_id: cronogramaEtapa.etapa.cronograma.atividade_id,
                    // descricao: cronogramaEtapa.etapa.cronograma.descricao,

                    ...cronogramaEtapa.etapa.cronograma
                }
            })
        }

        return ret;
    }

    async update(findParams: RequiredFindParamsDto, updateCronogoramaEtapaDto: UpdateCronogramaEtapaDto, user: PessoaFromJwt) {

        let id;
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const cronogramaEtapa = await prisma.cronogramaEtapa.upsert({
                where: {
                    CronogramaEtapaUniq: {
                        cronograma_id: findParams.cronograma_id,
                        etapa_id: findParams.etapa_id
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
