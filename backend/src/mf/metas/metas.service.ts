import { Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Serie } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from 'src/common/date2ymd';
import { PrismaService } from 'src/prisma/prisma.service';
import { SerieValorNomimal } from 'src/variavel/entities/variavel.entity';
import { CicloAtivoDto, IniciativasRetorno, MfMetaAgrupadaDto, MfSeriesAgrupadas, RetornoMetaVariaveisDto, VariavelComSeries, VariavelQtdeDto } from './dto/mf-meta.dto';

type VariavelDetalhe = {
    id: number;
    codigo: string;
    titulo: string;
    indicador_variavel: {
        indicador: {
            iniciativa_id?: number | null;
            atividade_id?: number | null;
            meta_id?: number | null;
        };
    }[]
};

type SerieseTotais = {
    totais: VariavelQtdeDto
    variaveis: VariavelComSeries[]
}

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

type VariavelDetailhePorID = Record<number, VariavelDetalhe>;

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


    extraiVariaveis(
        map: VariavelDetailhePorID,
        seriesPorVariavel: Record<number, MfSeriesAgrupadas[]>,
        fieldName: 'meta_id' | 'iniciativa_id' | 'atividade_id', fieldMatch: number,
        cicloFisicoAtivo: CicloAtivoDto,
    ): SerieseTotais {

        const seriesDaX: VariavelComSeries[] = [];
        let aguarda_complementacao = 0;
        let aguarda_cp = 0;
        let nao_preenchidas = 0;

        for (const varId of Object.keys(map)) {
            const variavel = map[+varId];
            if (variavel.indicador_variavel[0].indicador[fieldName] === fieldMatch) {

                for (const variavelPeriodo of seriesPorVariavel[+varId]) {
                    if (variavelPeriodo.aguarda_cp) {
                        aguarda_cp++;
                    } else if (variavelPeriodo.aguarda_complementacao) {
                        aguarda_cp++;
                    } else if (variavelPeriodo.ciclo_fisico_id == cicloFisicoAtivo.id) { // apenas das variaveis do ciclo
                        nao_preenchidas++;
                    }
                }

                seriesDaX.push({
                    variavel: { id: variavel.id, codigo: variavel.codigo, titulo: variavel.titulo },
                    series: seriesPorVariavel[+varId]
                });
            }
        }

        return {
            totais: {
                aguarda_complementacao,
                aguarda_cp,
                nao_preenchidas,
            },
            variaveis: seriesDaX
        }

    }

    async metaVariaveis(
        meta_id: number,
        config: PessoaAcessoPdm,
        cicloFisicoAtivo: CicloAtivoDto,
        user: PessoaFromJwt
    ): Promise<RetornoMetaVariaveisDto> {

        const variaveisMeta = await this.getVariaveisMeta(meta_id, config.variaveis);

        const [indicador, calcSerieVariaveis] = await Promise.all([
            this.prisma.indicador.findFirst({
                where: {
                    meta_id: meta_id,
                    removido_em: null
                },
                select: {
                    titulo: true, id: true, codigo: true
                }
            }),
            this.calcSerieVariaveis(variaveisMeta, config, cicloFisicoAtivo, user),
        ]);

        const retorno: RetornoMetaVariaveisDto = {
            perfil: config.perfil,
            ordem_series: calcSerieVariaveis.ordem_series,
            meta: {
                indicador: indicador,
                iniciativas: [],
                ...this.extraiVariaveis(variaveisMeta, calcSerieVariaveis.seriesPorVariavel, 'meta_id', meta_id, cicloFisicoAtivo),
            },
        }

        // busca apenas iniciativas que tem nas variaveis
        const iniciativas = await this.getIniciativas(meta_id, variaveisMeta);
        const atividades = await this.getAtividades(meta_id, variaveisMeta);


        for (const iniciativa of iniciativas) {
            const retornoIniciativa: IniciativasRetorno = {
                atividades: [],
                indicador: { ...iniciativa.Indicador[0] },
                iniciativa: { id: iniciativa.id, codigo: iniciativa.codigo, titulo: iniciativa.titulo },
                ...this.extraiVariaveis(variaveisMeta, calcSerieVariaveis.seriesPorVariavel, 'iniciativa_id', iniciativa.id, cicloFisicoAtivo),
            };

            for (const atividade of atividades) {
                if (+atividade.iniciativa_id != +iniciativa.id) continue;

                retornoIniciativa.atividades.push({
                    indicador: { ...atividade.Indicador[0] },
                    atividade: { id: atividade.id, codigo: atividade.codigo, titulo: atividade.titulo },
                    ...this.extraiVariaveis(variaveisMeta, calcSerieVariaveis.seriesPorVariavel, 'atividade_id', atividade.id, cicloFisicoAtivo),
                });

            }

            retorno.meta.iniciativas.push(retornoIniciativa)
        }

        return retorno;

    }

    private async calcSerieVariaveis(
        map: VariavelDetailhePorID,
        config: PessoaAcessoPdm,
        ciclo: CicloAtivoDto,
        user: PessoaFromJwt): Promise<{
            ordem_series: Serie[],
            seriesPorVariavel: Record<number, MfSeriesAgrupadas[]>
        }> {
        const [statusVariaveisCorrente, buscaSerieValoresResult] = await Promise.all([
            this.statusVariaveisDb(map, ciclo),
            this.buscaSeriesValores(map, ciclo)
        ]);

        const statusPorVariavel: Record<number, typeof statusVariaveisCorrente[0]> = {};
        for (const r of statusVariaveisCorrente) {
            statusPorVariavel[r.variavel_id] = r;
        }

        // retorna uma lista com cada variavel com o mes do ciclo corrente e o ciclo anterior
        // e se existir valores, vem junto (todas as series)
        const seriesVariavel = buscaSerieValoresResult.seriesVariavel;
        const seriesValores = buscaSerieValoresResult.seriesValores;

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


        //let ordem_series: Serie[] = ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'];
        let ordem_series : Serie[]= [   "Previsto",
        "Realizado",
        "RealizadoAcumulado",
        "PrevistoAcumulado"];
        //shuffleArray(ordem_series); // garante que o consumidor não está usando os valores das series cegamente

        const seriesPorVariavel: Record<number, MfSeriesAgrupadas[]> = {};
        for (const r of seriesVariavel) {
            const variavel = map[r.variavel_id];
            const status = statusPorVariavel[r.variavel_id];

            const corrente: SerieValorNomimal[] = [];

            for (const serie of ordem_series) {
                this.pushSerieVariavel(corrente, porVariavelIdDataSerie, variavel.id, r.data_corrente, true, serie);
            }

            const anterior: SerieValorNomimal[] = [];
            for (const serie of ordem_series) {
                this.pushSerieVariavel(anterior, porVariavelIdDataSerie, variavel.id, r.data_anterior, false, serie);
            }

            seriesPorVariavel[variavel.id] = [
                {
                    agrupador: '',
                    ciclo_fisico_id: ciclo.id,
                    periodo: r.data_corrente,
                    series: corrente,
                    pode_editar: true,
                    aguarda_cp: status && status.aguarda_cp ? true : false,
                    aguarda_complementacao: status && status.aguarda_complementacao ? true : false,
                },
                {
                    agrupador: '',
                    ciclo_fisico_id: null,
                    periodo: r.data_anterior,
                    series: anterior,
                    pode_editar: config.perfil == 'ponto_focal'
                }
            ];

        }

        return {
            ordem_series,
            seriesPorVariavel: seriesPorVariavel
        }
    }


    private pushSerieVariavel(
        serieValores: SerieValorNomimal[],
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
            serieValores.push({
                data_valor: Date2YMD.toString(existeSerieValor.data_valor),
                referencia: '',
                valor_nominal: existeSerieValor.valor_nominal.toString(),
                conferida: existeSerieValor.conferida
            });
        } else {
            serieValores.push({
                data_valor: dataReferencia,
                referencia: '',
                valor_nominal: '',
                conferida: ehCorrente ? false : true // -- datas no passado sao sempre conferidas
            });
        }
    }

    private async buscaSeriesValores(map: VariavelDetailhePorID, ciclo: CicloAtivoDto) {
        const seriesVariavel: { data_corrente: string, data_anterior: string, variavel_id: number }[]
            = await this.prisma.$queryRaw`select
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

    private async statusVariaveisDb(map: VariavelDetailhePorID, ciclo: CicloAtivoDto) {
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

    private async getAtividades(meta_id: number, map: VariavelDetailhePorID) {
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

    private async getIniciativas(meta_id: number, map: VariavelDetailhePorID) {
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
        const map: VariavelDetailhePorID = {};
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
            map[r.id] = r;
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
            map[r.id] = r;
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
            map[r.id] = r;
        }

        return map;
    }


}
