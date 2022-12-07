import { Injectable } from '@nestjs/common';
import { IniciativasCronoRetorno, RetornoMetaCronogramaDto } from 'src/mf/metas/dto/mf-crono.dto';
import { MfService } from 'src/mf/mf.service';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class MetasCronogramaService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly mfService: MfService,
    ) { }

    async metaIniciativaAtividadesComCrono(meta_id: number): Promise<RetornoMetaCronogramaDto> {
        const dadosMetas: {
            meta_id: number
            iniciativa_id: number | null
            atividade_id: number | null
            cronograma_id: number
        }[] = await this.prisma.$queryRaw`
        select
            m.id as meta_id,
            null::int as iniciativa_id,
            null::int as atividade_id,
            im.id as cronograma_id
        from meta m
        join cronograma im on im.meta_id = m.id and im.removido_em is null
        where m.id = ${meta_id}
        and m.ativo = TRUE
        and m.removido_em is null
            UNION ALL
        select
            m.id as meta_id,
            i.id as iniciativa_id,
            null::int as atividade_id,
            ii.id as cronograma_id
        from meta m
        join iniciativa i on i.meta_id = m.id and i.removido_em is null
        join cronograma ii on ii.iniciativa_id = i.id and ii.removido_em is null
        where m.id = ${meta_id}
        and m.ativo = TRUE
        and m.removido_em is null
            UNION ALL
        select
            m.id as meta_id,
            i.id as iniciativa_id,
            a.id as atividade_id,
            ia.id as cronograma_id
        from meta m
        join iniciativa i on i.meta_id = m.id and i.removido_em is null
        join atividade a on a.iniciativa_id = i.id and a.removido_em is null
        join cronograma ia on ia.atividade_id = a.id and ia.removido_em is null
        where m.id = ${meta_id}
        and m.ativo = TRUE
        and m.removido_em is null
        `;

        const cronoMeta = await this.prisma.meta.findFirstOrThrow({
            where: {
                id: { in: dadosMetas.map(r => r.meta_id) },
            },
            select: {
                codigo: true,
                titulo: true,
                id: true,
                meta_responsavel: {
                    select: {
                        pessoa: {
                            select: {
                                nome_exibicao: true
                            },
                        },
                        orgao: {
                            select: {
                                sigla: true
                            }
                        },
                        coordenador_responsavel_cp: true
                    }
                }
            },
            orderBy: {
                codigo: 'asc'
            }
        });

        const iniciativas = await this.prisma.iniciativa.findMany({
            where: {
                id: { in: dadosMetas.filter(n => n.iniciativa_id !== null).map(n => n.iniciativa_id!) },
                removido_em: null,
            },
            select: {
                titulo: true, id: true, codigo: true,
                Indicador: {
                    where: {
                        removido_em: null,
                    },
                    select: { id: true, titulo: true, codigo: true }
                },
                iniciativa_responsavel: {
                    select: {
                        pessoa: {
                            select: {
                                nome_exibicao: true
                            },
                        },
                        orgao: {
                            select: {
                                sigla: true
                            }
                        },
                        coordenador_responsavel_cp: true
                    }
                }
            }
        });

        const atividades = await this.prisma.atividade.findMany({
            where: {
                id: { in: dadosMetas.filter(n => n.atividade_id !== null).map(n => n.atividade_id!) },
                removido_em: null,
            },
            select: {
                titulo: true, id: true, codigo: true,
                Indicador: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        id: true, titulo: true, codigo: true,
                    },
                },
                iniciativa_id: true,
                atividade_responsavel: {
                    select: {
                        pessoa: {
                            select: {
                                nome_exibicao: true
                            },
                        },
                        orgao: {
                            select: {
                                sigla: true
                            }
                        },
                        coordenador_responsavel_cp: true
                    }
                }
            }
        });


        const retorno: RetornoMetaCronogramaDto = {
            meta: {
                iniciativas: [],
                ...this.mfService.extraiResponsaveis(cronoMeta.meta_responsavel),
                id: meta_id,
                titulo: cronoMeta.titulo,
                codigo: cronoMeta.codigo,
                cronogramas: dadosMetas.filter(n => n.atividade_id == null && n.iniciativa_id == null).map(n => n.cronograma_id),
            },
        };

        for (const iniciativa of iniciativas) {
            const retornoIniciativa: IniciativasCronoRetorno = {
                atividades: [],
                iniciativa: {
                    id: iniciativa.id, codigo: iniciativa.codigo, titulo: iniciativa.titulo,
                    ...this.mfService.extraiResponsaveis(iniciativa.iniciativa_responsavel)
                },
                cronogramas: dadosMetas.filter(n => n.atividade_id == null && n.iniciativa_id == iniciativa.id).map(n => n.cronograma_id),
            };

            for (const atividade of atividades) {
                if (+atividade.iniciativa_id != +iniciativa.id) continue;

                retornoIniciativa.atividades.push({
                    atividade: {
                        id: atividade.id, codigo: atividade.codigo, titulo: atividade.titulo,
                        ...this.mfService.extraiResponsaveis(atividade.atividade_responsavel)
                    },
                    cronogramas: dadosMetas.filter(n => n.atividade_id == atividade.id).map(n => n.cronograma_id)
                });
            }

            retorno.meta!.iniciativas.push(retornoIniciativa)
        }

        return retorno;

    }



}
