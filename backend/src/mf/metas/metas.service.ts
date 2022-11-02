import { Injectable } from '@nestjs/common';
import { Periodicidade, PessoaAcessoPdm } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from 'src/common/date2ymd';
import { CicloFisicoAtivo } from 'src/pdm/dto/list-pdm.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CicloAtivoDto, IniciativasRetorno, MfMetaAgrupadaDto, RetornoMetaVariaveisDto } from './dto/mf-meta.dto';

type VariavelIdAtrasoNivel = {
    id: number;
    codigo: string;
    nivel: 'meta' | 'iniciativa' | 'atividade'
};

@Injectable()
export class MetasService {
    constructor(private readonly prisma: PrismaService) { }

    async metasPorFase(filters: { ids: number[] }): Promise<MfMetaAgrupadaDto[]> {

        const rows = await this.prisma.meta.findMany({
            where: {
                id: { in: filters.ids }
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                ciclo_fase: {
                    select: { ciclo_fase: true }
                }
            },
            orderBy: {
                codigo: 'asc'
            }
        });

        return rows.map((r) => {
            return {
                id: r.id,
                codigo: r.codigo,
                titulo: r.titulo,
                grupo: r.ciclo_fase?.ciclo_fase || 'Sem Ciclo Fase'
            }
        });
    }

    async metasPorStatus(filters: { ids: number[] }, ciclo_fisico_id: number): Promise<MfMetaAgrupadaDto[]> {

        const rows = await this.prisma.meta.findMany({
            where: {
                id: { in: filters.ids }
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,

                StatusMetaCicloFisico: {
                    where: {
                        ciclo_fisico_id: ciclo_fisico_id
                    },
                    select: {
                        status: true
                    }
                }
            },
            orderBy: {
                codigo: 'asc'
            }
        });

        return rows.map((r) => {
            return {
                id: r.id,
                codigo: r.codigo,
                titulo: r.titulo,
                grupo: r.StatusMetaCicloFisico[0]?.status || 'Não categorizado'
            }
        });
    }

    async metaVariaveis(
        meta_id: number,
        config: PessoaAcessoPdm,
        cicloFisicoAtivo: CicloAtivoDto,
        user: PessoaFromJwt
    ): Promise<RetornoMetaVariaveisDto> {

        const map = await this.getVariaveisMeta(meta_id, config.variaveis);
        console.log(map);


        const indicador = await this.prisma.indicador.findFirst({
            where: {
                meta_id: meta_id,
                removido_em: null
            },
            select: { titulo: true, id: true, codigo: true }
        });

        const calcSerieVariaveis = await this.calcSerieVariaveis(map, cicloFisicoAtivo);
        const ret: RetornoMetaVariaveisDto = {
            perfil: config.perfil,
            variaveis: {
                indicador: indicador,
                status: {
                    aguarda_complementacao: 0,
                    aguarda_cp: 0,
                    nao_preenchidas: 0
                },
                iniciativas: []
            }
        }

        // busca apenas iniciativas que tem nas variaveis
        const iniciativas = await this.getIniciativas(meta_id, map);
        const atividades = await this.getAtividades(meta_id, map);


        for (const iniciativa of iniciativas) {
            const retInit: IniciativasRetorno = {
                atividades: [],
                indicador: { ...iniciativa.Indicador[0] },
                iniciativa: { id: iniciativa.id, codigo: iniciativa.codigo, titulo: iniciativa.titulo },
                status: {
                    aguarda_complementacao: 0,
                    aguarda_cp: 0,
                    nao_preenchidas: 0,
                }
            };

            for (const atividade of atividades) {
                if (+atividade.iniciativa_id != +iniciativa.id) continue;

                retInit.atividades.push({
                    indicador: { ...atividade.Indicador[0] },
                    atividade: { id: atividade.id, codigo: atividade.codigo, titulo: atividade.titulo },
                    status: {
                        aguarda_complementacao: 0,
                        aguarda_cp: 0,
                        nao_preenchidas: 0,
                    }
                });

            }

            ret.variaveis.iniciativas.push(retInit)
        }
        console.log(iniciativas);

        return ret;

    }

    private async calcSerieVariaveis(map: Record<number, VariavelIdAtrasoNivel>, ciclo: CicloAtivoDto) {

        //const data = Date2YMD.toString

        const statusExistentes = await this.prisma.statusVariavelCicloFisico.findMany({
            where: {
                variavel_id: { in: Object.keys(map).map(n => +n) },
                ciclo_fisico_id: ciclo.id
            }
        });

        const seriesVariavel: any[] = await this.prisma.$queryRaw`
        with dtCorrente as (select ${Date2YMD.toString(ciclo.data_ciclo)}::date as data)
        select
            (cte.data - (atraso_meses || 'month')::interval)::date::text as data_corrente,
            (cte.data - (atraso_meses || 'month')::interval - periodicidade_intervalo(periodicidade))::date::text as data_anterior,
            id as variavel_id
        from
            dtCorrente cte,
            variavel v
        where v.id = ANY(${Object.keys(map)}::int[])
        `;

        console.log(seriesVariavel);

        for (const variavel of seriesVariavel) {

        }
        /*const seriesVariavel = await this.prisma.serieVariavel.findMany({
            where: {
                variavel_id:
            }
        });
        console.log(map);*/


    }

    private async getAtividades(meta_id: number, map: Record<number, VariavelIdAtrasoNivel>) {
        return await this.prisma.atividade.findMany({
            where: {
                removido_em: null,
                Indicador: {
                    some: {
                        removido_em: null,
                        IndicadorVariavel: {
                            some: {
                                desativado_em: null,
                                variavel_id: { in: Object.keys(map).map(n => +n) }
                            }
                        }
                    }
                }
            },
            select: {
                titulo: true, id: true, codigo: true,
                Indicador: {
                    where: {
                        removido_em: null,
                    },
                    select: { id: true, titulo: true, codigo: true },
                },
                iniciativa_id: true
            }
        });
    }

    private async getIniciativas(meta_id: number, map: Record<number, VariavelIdAtrasoNivel>) {
        return await this.prisma.iniciativa.findMany({
            where: {
                meta_id: meta_id,
                removido_em: null,
                Indicador: {
                    some: {
                        removido_em: null,
                        IndicadorVariavel: {
                            some: {
                                desativado_em: null,
                                variavel_id: { in: Object.keys(map).map(n => +n) }
                            }
                        }
                    }
                }
            },
            select: {
                titulo: true, id: true, codigo: true,
                Indicador: {
                    where: {
                        removido_em: null,
                    },
                    select: { id: true, titulo: true, codigo: true }
                }
            }
        });
    }

    private async getVariaveisMeta(meta_id: number, inIds: number[]) {
        const map: Record<number, VariavelIdAtrasoNivel> = {};
        const variaveis_da_meta = await this.prisma.variavel.findMany({
            where: {
                id: { in: inIds },
                indicador_variavel: {
                    some: {
                        desativado_em: null,
                        indicador_origem: null,
                        indicador: {
                            meta_id: meta_id,
                            removido_em: null
                        }
                    }
                },
            },
            select: {
                id: true,
                codigo: true,
            }
        });
        for (const r of variaveis_da_meta) {
            map[r.id] = { ...r, nivel: 'meta' };
        }

        const variaveis_da_iniciativa = await this.prisma.variavel.findMany({
            where: {
                id: { in: inIds },
                indicador_variavel: {
                    some: {
                        indicador_origem: null,
                        desativado_em: null,
                        indicador: {
                            removido_em: null,
                            iniciativa: {
                                meta_id: meta_id,
                                removido_em: null
                            }
                        }
                    }
                },
            },
            select: {
                id: true,
                codigo: true,
            }
        });
        for (const r of variaveis_da_iniciativa) {
            map[r.id] = { ...r, nivel: 'iniciativa' };
        }

        const variaveis_da_atividade = await this.prisma.variavel.findMany({
            where: {
                id: { in: inIds },
                indicador_variavel: {
                    some: {
                        indicador_origem: null,
                        desativado_em: null,
                        indicador: {
                            atividade: {
                                removido_em: null,
                                iniciativa: {
                                    meta_id: meta_id,
                                    removido_em: null
                                }
                            }
                        }
                    }
                },
            },
            select: {
                id: true,
                codigo: true,
            }
        });
        for (const r of variaveis_da_atividade) {
            map[r.id] = { ...r, nivel: 'atividade' };
        }

        return map;
    }


}
