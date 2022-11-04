import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma, Serie } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from 'src/common/date2ymd';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SerieValorNomimal } from 'src/variavel/entities/variavel.entity';
import { VariavelService } from 'src/variavel/variavel.service';
import { AnaliseQualitativaDto, CamposRealizado, CamposRealizadoParaSerie, CicloAtivoDto, FilterAnaliseQualitativaDto, IniciativasRetorno, MfListAnaliseQualitativaDto, MfMetaAgrupadaDto, MfMetaDto, MfSeriesAgrupadas, RetornoMetaVariaveisDto, VariavelComSeries, VariavelQtdeDto } from './dto/mf-meta.dto';

type DadosCiclo = { variavelParticipa: boolean, id: number, ativo: boolean };

type StatusTracking = {
    algumaAguardaCp: boolean,
    algumaAguardaComplementacao: boolean
    algumaNaoInformada: boolean
    algumaNaoConferida: boolean
}

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
    constructor(
        private readonly variavelService: VariavelService,
        private readonly prisma: PrismaService
    ) { }


    async metas(config: PessoaAcessoPdm, cicloAtivoId: number): Promise<MfMetaDto[]> {

        const rows = await this.prisma.meta.findMany({
            where: {
                id: { in: [...config.metas_cronograma, ...config.metas_variaveis] }
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                ciclo_fase: {
                    select: { ciclo_fase: true }
                },
                StatusMetaCicloFisico: {
                    where: {
                        ciclo_fisico_id: cicloAtivoId
                    },
                    select: {
                        status_coleta: true,
                        status_cronograma: true,
                        status_valido: true,
                    }
                },
                meta_orgao: {
                    where: {
                        responsavel: true,
                    },
                    select: {
                        orgao: { select: { sigla: true, descricao: true } }
                    }
                }
            },
            orderBy: {
                codigo: 'asc'
            }
        });

        const out: MfMetaDto[] = [];

        for (const r of rows) {


            let status_coleta = '';
            let status_cronograma = '';
            if (r.StatusMetaCicloFisico[0] && r.StatusMetaCicloFisico[0].status_coleta) {
                status_coleta = r.StatusMetaCicloFisico[0].status_coleta;
            }
            if (r.StatusMetaCicloFisico[0] && r.StatusMetaCicloFisico[0].status_cronograma) {
                status_cronograma = r.StatusMetaCicloFisico[0].status_cronograma;
            }

            out.push({
                fase: r.ciclo_fase?.ciclo_fase || '(sem fase)',
                codigo: r.codigo,
                id: r.id,
                titulo: r.titulo,
                codigo_organizacoes: r.meta_orgao ? r.meta_orgao.map(e => e.orgao.sigla || e.orgao.descricao) : ['Sem Organização'],
                coleta: {
                    participante: config.metas_variaveis.includes(r.id),
                    status: status_coleta
                },
                cronograma: {
                    participante: config.metas_cronograma.includes(r.id),
                    status: status_cronograma
                },

            })
        }

        return out;
    }


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
                        status_coleta: true
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
                grupo: r.StatusMetaCicloFisico[0]?.status_coleta || 'Não categorizado'
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
                    } else if (variavelPeriodo.periodo === Date2YMD.toString(cicloFisicoAtivo.data_ciclo)) { // apenas das variaveis do ciclo
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

        const totalStatusTracking: StatusTracking = {
            algumaAguardaComplementacao: false,
            algumaAguardaCp: false,
            algumaNaoInformada: false,
            algumaNaoConferida: false
        };

        const currentStatus = await this.prisma.statusMetaCicloFisico.findFirst({
            where: { meta_id: meta_id, ciclo_fisico_id: cicloFisicoAtivo.id },
            select: {
                id: true,
                status_coleta: true
            }
        });

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
            this.calcSerieVariaveis(variaveisMeta, config, cicloFisicoAtivo, user, totalStatusTracking),
        ]);


        // provavelmente isso ta muito errado...
        const status = totalStatusTracking.algumaAguardaComplementacao ? 'Aguardando complementação' :
            totalStatusTracking.algumaNaoInformada ? 'Aguardando preenchimento' :
                totalStatusTracking.algumaNaoConferida ? 'Não conferidas' : 'Outras metas';

        if (!currentStatus) {
            await this.prisma.statusMetaCicloFisico.create({
                data: {
                    meta_id: meta_id,
                    ciclo_fisico_id: cicloFisicoAtivo.id,
                    status_coleta: status
                },
            })
        } else {
            if (status !== currentStatus.status_coleta) {
                await this.prisma.statusMetaCicloFisico.update({
                    where: {
                        id: currentStatus.id
                    },
                    data: {
                        status_coleta: status
                    },
                })
            }
        }

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
        user: PessoaFromJwt,
        statusTracking: StatusTracking): Promise<{
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


        let ordem_series: Serie[] = ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'];
        shuffleArray(ordem_series); // garante que o consumidor não está usando os valores das series cegamente

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

            const permissoes = this.calculaPermissoesSerieCorrente(config, status, porVariavelIdDataSerie, variavel.id, r.data_corrente);

            if (status && status.aguarda_cp) {
                statusTracking.algumaAguardaCp = true;
            } else if (status && status.aguarda_complementacao) {
                statusTracking.algumaAguardaComplementacao = true;
            } else if (permissoes.ha_valor === false) {
                statusTracking.algumaNaoInformada = true;
            } else if (permissoes.todasConferidas == false) {
                statusTracking.algumaNaoConferida = true;
            }

            seriesPorVariavel[variavel.id] = [
                {
                    periodo: r.data_corrente,
                    series: corrente,
                    pode_editar: permissoes.pode_editar,
                    aguarda_cp: status && status.aguarda_cp ? true : false,
                    aguarda_complementacao: status && status.aguarda_complementacao ? true : false,
                },
                {
                    periodo: r.data_anterior,
                    series: anterior,
                    pode_editar: config.perfil !== 'ponto_focal'
                }
            ];

        }

        return {
            ordem_series,
            seriesPorVariavel: seriesPorVariavel
        }
    }

    calculaPermissoesSerieCorrente(
        config: PessoaAcessoPdm,
        status: { aguarda_complementacao: boolean; aguarda_cp: boolean; variavel_id: number; },
        porVariavelIdDataSerie: any,
        idVariavel: number,
        dataReferencia: DateYMD,
    ) {
        // isso ta errado, mas por enquanto tudo bem
        // o certo é verificar se já houve alguma vez uma submissão para a CP
        // mesmo que o valor seja vazio
        const existeSerieValorRealizado = porVariavelIdDataSerie[idVariavel]
            && porVariavelIdDataSerie[idVariavel][dataReferencia] &&
            porVariavelIdDataSerie[idVariavel][dataReferencia].Realizado
            && porVariavelIdDataSerie[idVariavel][dataReferencia].Realizado.valor_nominal !== ''
            ? true : false;

        let todasConferidas = true;
        let existeValorRealizado = false;
        if (porVariavelIdDataSerie[idVariavel] && porVariavelIdDataSerie[idVariavel][dataReferencia]) {

            for (const serie in porVariavelIdDataSerie[idVariavel][dataReferencia]) {
                const element = porVariavelIdDataSerie[idVariavel][dataReferencia][serie];
                if (!element) continue;
                if (serie == 'Realizado' && element.valor_nominal !== '') {
                    existeValorRealizado = true;
                }

                if (element.conferida == false) {
                    todasConferidas = false
                }
            }
        }
        // se nao tem valor, nao tem conferencia
        if (!existeValorRealizado) todasConferidas = false;

        if (config.perfil == 'ponto_focal') {
            return {
                todasConferidas: todasConferidas,
                ha_valor: existeSerieValorRealizado,
                pode_editar: status.aguarda_complementacao || (!status.aguarda_cp && !existeSerieValorRealizado)
            }
        } else {
            return {
                todasConferidas: todasConferidas,
                ha_valor: existeSerieValorRealizado,
                pode_editar: true
            }
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

    async addMetaVariavelAnaliseQualitativa(dto: AnaliseQualitativaDto, config: PessoaAcessoPdm, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto, meta_id);

        if (config.perfil == 'ponto_focal' && !dadosCiclo.ativo) {
            throw new HttpException('Você não pode enviar valores fora de um ciclo ainda ativo.', 400);
        }
        if (dto.enviar_para_cp && !dadosCiclo.ativo) {
            throw new HttpException('Não é possivel enviar para CP fora do ciclo ativo.', 400);
        }

        // o trabalho pra montar um SerieJwt não faz sentido
        // entao vamos operar diretamente na SerieVariavel
        const id = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
            // isolation lock
            await prismaTxn.variavel.findFirst({ where: { id: dto.variavel_id }, select: { id: true } });

            let needRecalc = false;
            for (const campo of CamposRealizado) {
                const valor_nominal = dto[campo];
                if (valor_nominal === undefined) continue;


                const existeValor = await this.prisma.serieVariavel.findFirst({
                    where: {
                        variavel_id: dto.variavel_id,
                        serie: CamposRealizadoParaSerie[campo],
                        data_valor: dto.data_valor,
                    },
                    select: { id: true, valor_nominal: true, ciclo_fisico_id: true }
                });

                if (existeValor && valor_nominal === '') {
                    // existe o valor, mas é pra remover, então bora
                    needRecalc = true;

                    await this.prisma.serieVariavel.delete({
                        where: {
                            id: existeValor.id
                        }
                    });
                } else if (!existeValor && valor_nominal !== '') {
                    // valor não existe, entao vamos criar
                    needRecalc = true;

                    await this.prisma.serieVariavel.create({
                        data: {
                            variavel_id: dto.variavel_id,
                            serie: CamposRealizadoParaSerie[campo],
                            data_valor: dto.data_valor,
                            valor_nominal: valor_nominal,
                            atualizado_em: now,
                            atualizado_por: user.id,
                            ciclo_fisico_id: dadosCiclo.id,
                            // se o ciclo nao ta ativo, entao já ta conferida automaticamente
                            conferida: dadosCiclo.ativo ? false : true,
                        }
                    });
                } else if (existeValor && valor_nominal !== '') {

                    var valorModificado = existeValor.valor_nominal.toString() !== valor_nominal;
                    // se os valores mudaram, ou se faltava o ciclo_fisico_id
                    if (
                        valorModificado
                        ||
                        existeValor.ciclo_fisico_id === null
                    ) {
                        needRecalc = true;

                        await this.prisma.serieVariavel.update({
                            where: { id: existeValor.id },
                            data: {
                                valor_nominal: valor_nominal,
                                atualizado_em: now,
                                atualizado_por: user.id,
                                ciclo_fisico_id: dadosCiclo.id,
                                // se o ciclo nao ta ativo, entao já ta conferida automaticamente
                                conferida: valorModificado ? (dadosCiclo.ativo ? false : true) : undefined,
                            }
                        });
                    }
                }

            }
            if (needRecalc) {
                await this.variavelService.recalc_variaveis_acumulada([dto.variavel_id], prismaTxn);
                await this.variavelService.recalc_indicador_usando_variaveis([dto.variavel_id], prismaTxn);
            }

            await prismaTxn.variavelCicloFisicoQualitativo.updateMany({
                where: {
                    ciclo_fisico_id: dadosCiclo.id,
                    variavel_id: dto.variavel_id,
                    ultima_revisao: true
                },
                data: {
                    ultima_revisao: false,
                }
            });



            const cfq = await prismaTxn.variavelCicloFisicoQualitativo.create({
                data: {
                    ciclo_fisico_id: dadosCiclo.id,
                    variavel_id: dto.variavel_id,
                    ultima_revisao: true,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: dto.data_valor,
                    analise_qualitativa: dto.analise_qualitativa,
                    meta_id: meta_id,
                    enviado_para_cp: dto.enviar_para_cp,
                },
                select: { id: true }
            });

            if (dto.enviar_para_cp) {
                await prismaTxn.statusVariavelCicloFisico.deleteMany({
                    where: {
                        variavel_id: dto.variavel_id,
                        ciclo_fisico_id: dadosCiclo.id,
                    }
                });
                await prismaTxn.statusVariavelCicloFisico.create({
                    data: {
                        variavel_id: dto.variavel_id,
                        ciclo_fisico_id: dadosCiclo.id,
                        aguarda_cp: true,
                        meta_id: meta_id,
                    }
                });
            }

            return cfq.id;
        }, {
            isolationLevel: 'Serializable',
            maxWait: 15000,
            timeout: 25000,
        });

        return { id: id }
    }

    async getMetaVariavelAnaliseQualitativa(dto: FilterAnaliseQualitativaDto, config: PessoaAcessoPdm, user: PessoaFromJwt): Promise<MfListAnaliseQualitativaDto> {
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto, meta_id);
        console.log(dadosCiclo);

        const variavel = await this.prisma.variavel.findFirstOrThrow({
            where: {
                id: dto.variavel_id,
            },
            select: {
                id: true,
                codigo: true,
                titulo: true,
                unidade_medida: {
                    select: {
                        sigla: true,
                        descricao: true
                    }
                },
                regiao: {
                    select: {
                        id: true,
                        descricao: true
                    }
                },
                casas_decimais: true,
                acumulativa: true,
                periodicidade: true,
            }
        });

        const serieValores = await this.prisma.serieVariavel.findMany({
            where: {
                variavel_id: dto.variavel_id,
                data_valor: dto.data_valor,
            },
            select: {
                id: true,
                valor_nominal: true,
                serie: true,
                conferida: true,
            }
        });

        const analisesResult = await this.prisma.variavelCicloFisicoQualitativo.findMany({
            where: {
                ciclo_fisico_id: dadosCiclo.id,
                variavel_id: dto.variavel_id,
                ultima_revisao: dto.apenas_ultima_revisao ? true : undefined,
            },
            orderBy: {
                criado_em: 'desc',
            },
            select: {
                ultima_revisao: true,
                analise_qualitativa: true,
                criado_em: true,
                meta_id: true,
                enviado_para_cp: true,
                pessoaCriador: {
                    select: { nome_exibicao: true }
                },
                id: true
            }
        });


        return {
            analises: analisesResult.map((r) => {
                return {
                    analise_qualitativa: r.analise_qualitativa || '',
                    ultima_revisao: r.ultima_revisao,
                    criado_em: r.criado_em,
                    meta_id: r.meta_id,
                    enviado_para_cp: r.enviado_para_cp,
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao }
                }
            }),
            ordem_series: [],
            series: [],
            variavel: variavel,
        }
    }


    private async capturaDadosCicloVariavel(dateYMD: string, dto: FilterAnaliseQualitativaDto, meta_id: number) {
        const dadosCicloResult: DadosCiclo[] = await this.prisma.$queryRaw`
            select
                variavel_participa_do_ciclo( v.id, ${dateYMD}::date ) as "variavelParticipa",
                cf.ativo as ativo,
                cf.id as id
            from ciclo_fisico cf,
            variavel v
            where v.id = ${dto.variavel_id}::int
            AND cf.data_ciclo = ${dateYMD}::date + (v.atraso_meses || ' month')::interval
            and cf.pdm_id = (select pdm_id from meta where id = ${meta_id})
        `;
        const dadosCiclo = dadosCicloResult[0];
        console.log(dadosCiclo);
        if (!dadosCiclo) throw new HttpException(`Ciclo não encontrado no PDM`, 404);
        if (!dadosCiclo.variavelParticipa)
            throw new HttpException(`Nenhum ciclo encontrado para preenchmento em ${dateYMD} na variável ${dto.variavel_id}`, 400);
        return dadosCiclo;
    }
}
