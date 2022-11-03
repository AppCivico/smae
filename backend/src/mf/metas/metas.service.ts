import { Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Serie } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from 'src/common/date2ymd';
import { PrismaService } from 'src/prisma/prisma.service';
import { SerieValorNomimal } from 'src/variavel/entities/variavel.entity';
import { CicloAtivoDto, IniciativasRetorno, MfMetaAgrupadaDto, Niveis, RetornoMetaVariaveisDto, StatusPorNivel, VariavelQtdeDto, ZeroStatuses } from './dto/mf-meta.dto';


type VariavelIdAtrasoNivel = {
    id: number;
    codigo: string;
    titulo: string;
    nivel: Niveis
    indicador_variavel: {
        indicador: {
            iniciativa_id?: number | null;
            atividade_id?: number | null;
            meta_id?: number | null;
        };
    }[]
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
        console.dir(map, { depth: null });


        const indicador = await this.prisma.indicador.findFirst({
            where: {
                meta_id: meta_id,
                removido_em: null
            },
            select: {
                titulo: true, id: true, codigo: true
            }
        });

        const calcSerieVariaveis = await this.calcSerieVariaveis(map, cicloFisicoAtivo);
        const ret: RetornoMetaVariaveisDto = {
            perfil: config.perfil,
            status_por_nivel: calcSerieVariaveis.statusPorNivel,
            ordem_series: calcSerieVariaveis.ordem_series,
            meta: {
                indicador: indicador,
                iniciativas: [],
                variaveis: []
            },
        }

        for (const varId of Object.keys(map)) {
            const variavel = map[+varId];
            if (variavel.indicador_variavel[0].indicador.meta_id === meta_id) {
                ret.meta.variaveis.push({
                    variavel: { id: variavel.id, codigo: variavel.codigo, titulo: variavel.titulo },
                    series: calcSerieVariaveis.seriesPorVariavel[+varId]
                });
            }
        }

        // busca apenas iniciativas que tem nas variaveis
        const iniciativas = await this.getIniciativas(meta_id, map);
        const atividades = await this.getAtividades(meta_id, map);


        for (const iniciativa of iniciativas) {
            const retornoIniciativa: IniciativasRetorno = {
                atividades: [],
                indicador: { ...iniciativa.Indicador[0] },
                iniciativa: { id: iniciativa.id, codigo: iniciativa.codigo, titulo: iniciativa.titulo },
            };

            for (const atividade of atividades) {
                if (+atividade.iniciativa_id != +iniciativa.id) continue;

                retornoIniciativa.atividades.push({
                    indicador: { ...atividade.Indicador[0] },
                    atividade: { id: atividade.id, codigo: atividade.codigo, titulo: atividade.titulo },
                });

            }

            ret.meta.iniciativas.push(retornoIniciativa)
        }
        console.log(iniciativas);

        return ret;

    }

    private async calcSerieVariaveis(map: Record<number, VariavelIdAtrasoNivel>, ciclo: CicloAtivoDto): Promise<{
        statusPorNivel: StatusPorNivel
        ordem_series: Serie[],
        seriesPorVariavel: Record<number, SerieValorNomimal[]>
    }> {
        const statusVariaveisDb = await this.statusVariaveisDb(map, ciclo);
        const statusPorVariavel: Record<number, typeof statusVariaveisDb[0]> = {};
        for (const r of statusVariaveisDb) {
            statusPorVariavel[r.variavel_id] = r;
        }

        // retorna uma lista com cada variavel com o mes do ciclo corrente e o ciclo anterior
        // e se existir valores, vem junto (todas as series)
        const { seriesVariavel, seriesValores } = { ...await this.buscaSeriesValores(map, ciclo) };

        // map pra variavel, depois a data, depois a serie
        const porVariavelIdDataSerie: Record<number, Record<DateYMD, Record<Serie, typeof seriesValores[0] | null>>> = {};
        for (const r of seriesValores) {
            if (!porVariavelIdDataSerie[r.variavel_id])
                porVariavelIdDataSerie[r.variavel_id] = {};

            if (!porVariavelIdDataSerie[r.variavel_id][Date2YMD.toString(r.data_valor)])
                porVariavelIdDataSerie[r.variavel_id][Date2YMD.toString(r.data_valor)] = {
                    Previsto: null,
                    PrevistoAcumulado: null,
                    Realizado: null,
                    RealizadoAcumulado: null,
                };

            porVariavelIdDataSerie[r.variavel_id][Date2YMD.toString(r.data_valor)][r.serie] = r;
        }


        const statusPorNivel: Record<Niveis, VariavelQtdeDto> = {
            meta: { ...ZeroStatuses },
            atividade: { ...ZeroStatuses },
            iniciativa: { ...ZeroStatuses }
        };
        const seriesPorVariavel: Record<number, SerieValorNomimal[]> = {};
        for (const r of seriesVariavel) {
            const variavel = map[r.variavel_id];
            const status = statusPorVariavel[r.variavel_id];

            if (status && status.aguarda_complementacao) {
                statusPorNivel[variavel.nivel].aguarda_complementacao++;
            } else if (status && status.aguarda_cp) {
                statusPorNivel[variavel.nivel].aguarda_cp++;
            } else {
                statusPorNivel[variavel.nivel].nao_preenchidas++;
            }

            if (!seriesPorVariavel[variavel.id]) seriesPorVariavel[variavel.id] = [];

            this.pushSerieVariavel(seriesPorVariavel, porVariavelIdDataSerie, variavel.id, r.data_corrente, true, 'Previsto');
            this.pushSerieVariavel(seriesPorVariavel, porVariavelIdDataSerie, variavel.id, r.data_corrente, true, 'PrevistoAcumulado');
            this.pushSerieVariavel(seriesPorVariavel, porVariavelIdDataSerie, variavel.id, r.data_corrente, true, 'Realizado');
            this.pushSerieVariavel(seriesPorVariavel, porVariavelIdDataSerie, variavel.id, r.data_corrente, true, 'RealizadoAcumulado');


            this.pushSerieVariavel(seriesPorVariavel, porVariavelIdDataSerie, variavel.id, r.data_anterior, false, 'Previsto');
            this.pushSerieVariavel(seriesPorVariavel, porVariavelIdDataSerie, variavel.id, r.data_anterior, false, 'PrevistoAcumulado');
            this.pushSerieVariavel(seriesPorVariavel, porVariavelIdDataSerie, variavel.id, r.data_anterior, false, 'Realizado');
            this.pushSerieVariavel(seriesPorVariavel, porVariavelIdDataSerie, variavel.id, r.data_anterior, false, 'RealizadoAcumulado');

        }

        return {
            statusPorNivel: statusPorNivel,
            ordem_series: ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'],
            seriesPorVariavel: seriesPorVariavel
        }
    }


    private pushSerieVariavel(
        seriesPorVariavel: Record<number, SerieValorNomimal[]>,
        porVariavelIdDataSerie: any,
        idVariavel: number,
        dataReferencia: DateYMD,
        ehCorrente: boolean,
        serie: Serie
    ) {
        const existeSerieValor = porVariavelIdDataSerie[idVariavel]
        && porVariavelIdDataSerie[idVariavel][dataReferencia] &&
            porVariavelIdDataSerie[idVariavel][dataReferencia][serie] ? porVariavelIdDataSerie[idVariavel][dataReferencia][serie] : undefined;
        if (existeSerieValor) {
            seriesPorVariavel[idVariavel].push({
                data_valor: Date2YMD.toString(existeSerieValor.data_valor),
                referencia: '',
                valor_nominal: existeSerieValor.valor_nominal.toString(),
                conferida: existeSerieValor.conferida
            });
        } else {
            seriesPorVariavel[idVariavel].push({
                data_valor: dataReferencia,
                referencia: '',
                valor_nominal: '',
                conferida: ehCorrente ? false : true // -- datas no passado sao sempre conferidas
            });
        }
    }

    private async buscaSeriesValores(map: Record<number, VariavelIdAtrasoNivel>, ciclo: CicloAtivoDto) {
        const seriesVariavel: { data_corrente: string, data_anterior: string, variavel_id: number }[] = await this.prisma.$queryRaw`select
            (cte.data - (atraso_meses || 'month')::interval)::date::text as data_corrente,
            (cte.data - (atraso_meses || 'month')::interval - periodicidade_intervalo(periodicidade))::date::text as data_anterior,
            id as variavel_id
        from
            (select ${Date2YMD.toString(ciclo.data_ciclo)}::date as data) cte,
            variavel v
        where v.id = ANY(${Object.keys(map)}::int[])
        `;

        const conditions: { variavel_id: number, data_valor: Date }[] = [];
        for (const variavel of seriesVariavel) {
            conditions.push({
                variavel_id: variavel.variavel_id,
                data_valor: Date2YMD.fromString(variavel.data_anterior)
            });
            conditions.push({
                variavel_id: variavel.variavel_id,
                data_valor: Date2YMD.fromString(variavel.data_corrente)
            });
        }

        return {
            seriesValores: await this.prisma.serieVariavel.findMany({
                where: { 'OR': conditions },
                select: {
                    data_valor: true,
                    serie: true,
                    valor_nominal: true,
                    conferida: true,
                    variavel_id: true
                }
            }),
            seriesVariavel: seriesVariavel,
        };
    }

    private async statusVariaveisDb(map: Record<number, VariavelIdAtrasoNivel>, ciclo: CicloAtivoDto) {
        return await this.prisma.statusVariavelCicloFisico.findMany({
            where: {
                variavel_id: { in: Object.keys(map).map(n => +n) },
                ciclo_fisico_id: ciclo.id
            },
            select: {
                aguarda_complementacao: true,
                aguarda_cp: true,
                variavel_id: true
            }
        });
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
                    select: {
                        id: true, titulo: true, codigo: true,
                    },
                },
                iniciativa_id: true,
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
                },
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
                titulo: true,
                indicador_variavel: {
                    where: {
                        desativado_em: null,
                        indicador_origem: null,
                    },
                    select: {
                        indicador: {
                            select: {
                                meta_id: true
                            }
                        }
                    }
                }
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
                titulo: true,
                indicador_variavel: {
                    where: {
                        desativado_em: null,
                        indicador_origem: null,
                    },
                    select: {
                        indicador: {
                            select: {
                                iniciativa_id: true
                            }
                        }
                    }
                }
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
                titulo: true,
                indicador_variavel: {
                    where: {
                        desativado_em: null,
                        indicador_origem: null,
                    },
                    select: {
                        indicador: {
                            select: {
                                atividade_id: true
                            }
                        }
                    }
                }
            }
        });
        for (const r of variaveis_da_atividade) {
            map[r.id] = { ...r, nivel: 'atividade' };
        }

        return map;
    }


}
