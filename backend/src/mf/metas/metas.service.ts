import { HttpException, Injectable } from '@nestjs/common';
import { CicloFase, PessoaAcessoPdm, Prisma, Serie } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from '../../common/date2ymd';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { SerieValorNomimal } from '../../variavel/entities/variavel.entity';
import { VariavelService } from '../../variavel/variavel.service';
import { MfService } from './../mf.service';
import {
    CamposRealizado,
    CamposRealizadoParaSerie,
    CicloAtivoDto,
    CicloFaseDto,
    FilterMfMetasDto,
    FilterVariavelAnaliseQualitativaDto,
    IniciativasRetorno, MfAvancarFasesDto, MfFasesPermissoesDto,
    MfListVariavelAnaliseQualitativaDto,
    MfMetaDto, MfSeriesAgrupadas,
    MfSerieValorNomimal,
    RetornoMetaVariaveisDto,
    VariavelAnaliseQualitativaDocumentoDto,
    VariavelAnaliseQualitativaDto,
    VariavelComplementacaoDto,
    VariavelComSeries,
    VariavelConferidaDto,
    VariavelQtdeDto
} from './dto/mf-meta.dto';

type DadosCiclo = { variavelParticipa: boolean; id: number; ativo: boolean; meta_esta_na_coleta: boolean };

type DadosMetaIndicadores = {
    meta_id: number;
    iniciativa_id: number | null;
    atividade_id: number | null;
    indicador_id: number;
};

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
    }[];
};

type SerieseTotais = {
    totais: VariavelQtdeDto;
    variaveis: VariavelComSeries[];
};

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

type VariavelDetalhePorID = Record<number, VariavelDetalhe>;

@Injectable()
export class MetasService {
    constructor(
        private readonly variavelService: VariavelService,
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly mfService: MfService,
    ) { }

    async metas(config: PessoaAcessoPdm, cicloAtivoId: number, params: FilterMfMetasDto): Promise<MfMetaDto[]> {
        const rows = await this.prisma.meta.findMany({
            where: {
                id: { in: [...config.metas_cronograma, ...config.metas_variaveis] },
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                ciclo_fase: {
                    select: { ciclo_fase: true },
                },
                StatusMetaCicloFisico: {
                    where: {
                        ciclo_fisico_id: cicloAtivoId,
                    },
                    select: {
                        status_coleta: true,
                        status_cronograma: true,
                    },
                },
                meta_orgao: {
                    where: {
                        responsavel: true,
                    },
                    select: {
                        orgao: { select: { sigla: true, descricao: true } },
                    },
                },
            },
            orderBy: {
                codigo: 'asc',
            },
        });

        let metaStatus: { meta_id: number }[] | undefined = undefined;

        if (params.ciclo_fase == 'Analise') {
            metaStatus = await this.prisma.metaCicloFisicoAnalise.findMany({
                where: { ciclo_fisico_id: cicloAtivoId, removido_em: null },
                select: { meta_id: true },
            });
        } else if (params.ciclo_fase == 'Risco') {
            metaStatus = await this.prisma.metaCicloFisicoRisco.findMany({
                where: { ciclo_fisico_id: cicloAtivoId, removido_em: null },
                select: { meta_id: true },
            });
        } else if (params.ciclo_fase == 'Fechamento') {
            metaStatus = await this.prisma.metaCicloFisicoFechamento.findMany({
                where: { ciclo_fisico_id: cicloAtivoId, removido_em: null },
                select: { meta_id: true },
            });
        }
        const labelsPorStatus: Record<CicloFase, Record<'true' | 'false', string>> = {
            Analise: {
                false: 'Metas sem análise qualitativa',
                true: 'Metas com análise qualitativa',
            },
            Coleta: {
                false: '',
                true: '',
            },
            Risco: {
                false: 'Metas sem análise de risco',
                true: 'Metas com análise de risco',
            },
            Fechamento: {
                false: 'Metas não fechadas',
                true: 'Metas fechadas',
            },
        };
        console.log(params.ciclo_fase);

        const metasStatusPorMeta: Record<number, boolean> = {};
        if (metaStatus) {
            for (const r of metaStatus) {
                metasStatusPorMeta[r.meta_id] = true;
            }
        }

        const out: MfMetaDto[] = [];
        for (const r of rows) {
            let status_coleta = '';
            let status_cronograma = '';

            if (r.StatusMetaCicloFisico[0]) {
                status_coleta = r.StatusMetaCicloFisico[0].status_coleta;
                status_cronograma = r.StatusMetaCicloFisico[0].status_cronograma;
            } else {
                // atualiza o status
                await this.prisma.$queryRaw`select atualiza_status_meta_pessoa(${r.id}::int, ${config.pessoa_id}::int, ${cicloAtivoId}::int)`;
                // busca novamente, há uma pequena chance de já ter sido invalidado, nesse caso, ignora o status nesse render
                const novoStatus = await this.prisma.statusMetaCicloFisico.findFirst({
                    where: { ciclo_fisico_id: cicloAtivoId, meta_id: r.id, pessoa_id: config.pessoa_id },
                    select: { status_coleta: true, status_cronograma: true },
                });
                if (novoStatus) {
                    status_coleta = novoStatus.status_coleta;
                    status_cronograma = novoStatus.status_cronograma;
                } else {
                    status_coleta = 'Status desconhecido, atualize a página';
                    status_cronograma = 'Status desconhecido, atualize a página';
                }
            }

            const coleta = config.metas_variaveis.includes(r.id);
            const cronograma = config.metas_cronograma.includes(r.id);
            out.push({
                status_ciclo_fase: params.ciclo_fase ? labelsPorStatus[params.ciclo_fase][metasStatusPorMeta[r.id] ? 'true' : 'false'] : undefined,
                fase: r.ciclo_fase?.ciclo_fase || '(sem fase)',
                codigo: r.codigo,
                id: r.id,
                titulo: r.titulo,
                codigo_organizacoes: r.meta_orgao ? r.meta_orgao.map(e => e.orgao.sigla || e.orgao.descricao) : ['Sem Organização'],
                coleta: {
                    participante: coleta,
                    status: coleta ? status_coleta || 'Outros' : '',
                },
                cronograma: {
                    participante: cronograma,
                    status: cronograma ? status_cronograma || 'Outros' : '',
                },
            });
        }

        return out;
    }

    extraiVariaveis(
        map: VariavelDetalhePorID,
        seriesPorVariavel: Record<number, MfSeriesAgrupadas[]>,
        fieldName: 'meta_id' | 'iniciativa_id' | 'atividade_id',
        fieldMatch: number,
        cicloFisicoAtivo: CicloAtivoDto,
    ): SerieseTotais {
        const seriesDaX: VariavelComSeries[] = [];
        let aguarda_complementacao = 0;
        let aguarda_cp = 0;
        let nao_preenchidas = 0;
        let nao_enviadas = 0;

        for (const varId of Object.keys(map)) {
            const variavel = map[+varId];
            if (variavel.indicador_variavel[0].indicador[fieldName] === fieldMatch) {
                for (const variavelPeriodo of seriesPorVariavel[+varId]) {
                    if (variavelPeriodo.aguarda_cp) {
                        aguarda_cp++;
                    } else if (variavelPeriodo.aguarda_complementacao) {
                        aguarda_complementacao++;
                    } else if (variavelPeriodo.eh_corrente && variavelPeriodo.nao_preenchida) {
                        nao_preenchidas++;
                    } else if (variavelPeriodo.eh_corrente && variavelPeriodo.nao_enviada) {
                        nao_enviadas++;
                    }
                }

                seriesDaX.push({
                    variavel: { id: variavel.id, codigo: variavel.codigo, titulo: variavel.titulo },
                    series: seriesPorVariavel[+varId],
                });
            }
        }

        return {
            totais: {
                aguarda_complementacao,
                aguarda_cp,
                nao_preenchidas,
                nao_enviadas,
            },
            variaveis: seriesDaX,
        };
    }

    async metaVariaveis(meta_id: number, config: PessoaAcessoPdm, cicloFisicoAtivo: CicloAtivoDto, user: PessoaFromJwt): Promise<RetornoMetaVariaveisDto> {
        const dadosMetas: DadosMetaIndicadores[] = await this.buscaMetaIndicadores(meta_id);
        const variaveisMeta = await this.getVariaveisMeta(meta_id, config.variaveis);

        const indicadorMeta = await this.prisma.indicador.findFirst({
            where: {
                meta_id: meta_id,
                removido_em: null,
            },
            select: {
                titulo: true,
                id: true,
                codigo: true,
                meta: {
                    select: {
                        ciclo_fase: {
                            select: { ciclo_fase: true },
                        },
                        codigo: true,
                        titulo: true,
                        id: true,
                        meta_responsavel: {
                            select: {
                                pessoa: {
                                    select: {
                                        nome_exibicao: true,
                                    },
                                },
                                orgao: {
                                    select: {
                                        sigla: true,
                                    },
                                },
                                coordenador_responsavel_cp: true,
                            },
                        },
                    },
                },
            },
        });
        if (!indicadorMeta || !indicadorMeta.meta) throw new HttpException('404', 404);
        const metaEstaFaseColeta = indicadorMeta.meta.ciclo_fase?.ciclo_fase === 'Coleta';

        const calcSerieVariaveis = await this.calcSerieVariaveis(variaveisMeta, config, cicloFisicoAtivo, metaEstaFaseColeta);
        //console.dir(calcSerieVariaveis, { depth: 33 });

        const cicloFase = indicadorMeta.meta.ciclo_fase?.ciclo_fase ? indicadorMeta.meta.ciclo_fase?.ciclo_fase : '';

        // ordernar pela codigo da variavel
        const retorno: RetornoMetaVariaveisDto = {
            perfil: config.perfil,
            ordem_series: calcSerieVariaveis.ordem_series,
            meta: {
                indicador: indicadorMeta,
                iniciativas: [],
                ...this.extraiVariaveis(variaveisMeta, calcSerieVariaveis.seriesPorVariavel, 'meta_id', meta_id, cicloFisicoAtivo),
                ...this.mfService.extraiResponsaveis(indicadorMeta.meta.meta_responsavel),
                id: meta_id,
                titulo: indicadorMeta.meta.titulo,
                codigo: indicadorMeta.meta.codigo,
                ciclo_fase: cicloFase,
            },
            permissoes: this.calculaPermissoesFase(cicloFase as CicloFase, config.perfil),
            avancarFases: this.avancarFases(cicloFase as CicloFase, config.perfil),
            botao_enviar_cp: false,
        };
        delete (indicadorMeta as any).meta;

        if (retorno.meta.totais.nao_enviadas > 0 && config.perfil === 'ponto_focal')
            retorno.botao_enviar_cp = true;

        // busca apenas iniciativas que tem nas variaveis
        const iniciativas = await this.getIniciativas(meta_id, dadosMetas);
        const atividades = await this.getAtividades(meta_id, dadosMetas);

        for (const iniciativa of iniciativas) {
            const retornoIniciativa: IniciativasRetorno = {
                atividades: [],
                indicador: { ...iniciativa.Indicador[0] },
                iniciativa: {
                    id: iniciativa.id,
                    codigo: iniciativa.codigo,
                    titulo: iniciativa.titulo,
                    ...this.mfService.extraiResponsaveis(iniciativa.iniciativa_responsavel),
                },
                ...this.extraiVariaveis(variaveisMeta, calcSerieVariaveis.seriesPorVariavel, 'iniciativa_id', iniciativa.id, cicloFisicoAtivo),
            };

            if (retornoIniciativa.totais.nao_enviadas > 0 && config.perfil === 'ponto_focal')
                retorno.botao_enviar_cp = true;

            let atividadesComVarCount = retornoIniciativa.variaveis.length;
            for (const atividade of atividades) {
                if (+atividade.iniciativa_id != +iniciativa.id) continue;

                const atv: (typeof retornoIniciativa.atividades)[0] = {
                    indicador: { ...atividade.Indicador[0] },
                    atividade: {
                        id: atividade.id,
                        codigo: atividade.codigo,
                        titulo: atividade.titulo,
                        ...this.mfService.extraiResponsaveis(atividade.atividade_responsavel),
                    },
                    ...this.extraiVariaveis(variaveisMeta, calcSerieVariaveis.seriesPorVariavel, 'atividade_id', atividade.id, cicloFisicoAtivo),
                };

                if (atv.variaveis.length > 0) {
                    retornoIniciativa.atividades.push(atv);
                    atividadesComVarCount++;

                    if (atv.totais.nao_enviadas > 0 && config.perfil === 'ponto_focal')
                        retorno.botao_enviar_cp = true;
                }
            }

            if (atividadesComVarCount > 0) retorno.meta.iniciativas.push(retornoIniciativa);
        }

        return retorno;
    }

    private calculaPermissoesFase(cicloFase: CicloFase, perfil: string): MfFasesPermissoesDto {
        if (perfil == 'tecnico_cp' || perfil == 'admin_cp') {
            const map = {
                Coleta: {
                    analiseQualitativa: false,
                    fechamento: false,
                    risco: false,
                },
                Analise: {
                    analiseQualitativa: true,
                    fechamento: false,
                    risco: false,
                },
                Risco: {
                    analiseQualitativa: true,
                    fechamento: false,
                    risco: true,
                },
                Fechamento: {
                    analiseQualitativa: true,
                    fechamento: true,
                    risco: true,
                },
            } as const;

            if (map[cicloFase]) return map[cicloFase];
        }

        return {
            analiseQualitativa: false,
            fechamento: false,
            risco: false,
        };
    }

    private avancarFases(cicloFase: CicloFase, perfil: string): MfAvancarFasesDto {
        if (perfil == 'tecnico_cp' || perfil == 'admin_cp') {
            const map: Record<CicloFase, MfAvancarFasesDto> = {
                Coleta: ['Analise', 'Risco', 'Fechamento'],
                Analise: ['Risco', 'Fechamento'],
                Risco: ['Fechamento'],
                Fechamento: [],
            };
            if (map[cicloFase]) return map[cicloFase];
        }

        return [];
    }

    private async buscaMetaIndicadores(meta_id: number): Promise<DadosMetaIndicadores[]> {
        return await this.prisma.$queryRaw`
        select
            m.id as meta_id,
            null::int as iniciativa_id,
            null::int as atividade_id,
            im.id as indicador_id
        from meta m
        join indicador im on im.meta_id = m.id and im.removido_em is null
        where m.id = ${meta_id}
        and m.ativo = TRUE
        and m.removido_em is null
        group by 1,2,3,4
            UNION ALL
        select
            m.id as meta_id,
            i.id as iniciativa_id,
            null::int as atividade_id,
            ii.id as indicador_id
        from meta m
        join iniciativa i on i.meta_id = m.id and i.removido_em is null
        join indicador ii on ii.iniciativa_id = i.id and ii.removido_em is null
        where m.id = ${meta_id}
        and m.ativo = TRUE
        and m.removido_em is null
        group by 1,2,3,4
            UNION ALL
        select
            m.id as meta_id,
            i.id as iniciativa_id,
            a.id as atividade_id,
            ia.id as indicador_id
        from meta m
        join iniciativa i on i.meta_id = m.id and i.removido_em is null
        join atividade a on a.iniciativa_id = i.id and a.removido_em is null
        join indicador ia on ia.atividade_id = a.id and ia.removido_em is null
        where m.id = ${meta_id}
        and m.ativo = TRUE
        and m.removido_em is null
        group by 1,2,3,4`;
    }

    private async calcSerieVariaveis(
        map: VariavelDetalhePorID,
        config: PessoaAcessoPdm,
        ciclo: CicloAtivoDto,
        metaEstaFaseColeta: boolean,
    ): Promise<{
        ordem_series: Serie[];
        seriesPorVariavel: Record<number, MfSeriesAgrupadas[]>;
    }> {
        const [statusVariaveisCorrente, buscaSerieValoresResult] = await Promise.all([this.statusVariaveisDb(map, ciclo), this.buscaSeriesValores(map, ciclo)]);

        const statusPorVariavel: Record<number, (typeof statusVariaveisCorrente)[0] | null> = {};
        for (const r of statusVariaveisCorrente) {
            statusPorVariavel[r.variavel_id] = r;
        }

        // retorna uma lista com cada variavel com o mes do ciclo corrente e o ciclo anterior
        // e se existir valores, vem junto (todas as series)
        const seriesVariavel = buscaSerieValoresResult.seriesVariavel;
        const seriesValores = buscaSerieValoresResult.seriesValores;

        // map pra variavel, depois a data, depois a serie
        const porVariavelIdDataSerie: Record<number, Record<DateYMD, Record<Serie, (typeof seriesValores)[0] | null>>> = {};
        for (const r of seriesValores) {
            if (!porVariavelIdDataSerie[r.variavel_id]) porVariavelIdDataSerie[r.variavel_id] = {};

            if (!porVariavelIdDataSerie[r.variavel_id][Date2YMD.toString(r.data_valor)])
                porVariavelIdDataSerie[r.variavel_id][Date2YMD.toString(r.data_valor)] = {
                    Previsto: null,
                    PrevistoAcumulado: null,
                    Realizado: null,
                    RealizadoAcumulado: null,
                };

            porVariavelIdDataSerie[r.variavel_id][Date2YMD.toString(r.data_valor)][r.serie] = r;
        }

        const ordem_series: Serie[] = ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'];
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

            const permissoes = this.calculaPermissoesSerieCorrente(config, status, porVariavelIdDataSerie, variavel.id, r.data_corrente, metaEstaFaseColeta);

            const aguarda_complementacao = status ? status && status.aguarda_complementacao : false;
            // se ja conferiu (mesmo que um valor em branco) então ta pronta
            const nao_preenchida = status && status.conferida === true ? false : permissoes.ha_valor === false;

            seriesPorVariavel[variavel.id] = [
                {
                    eh_corrente: true,
                    periodo: r.data_corrente,
                    series: corrente,
                    pode_editar: permissoes.pode_editar,
                    aguarda_cp: status && status.aguarda_cp ? true : false,
                    aguarda_complementacao: aguarda_complementacao,
                    nao_enviada: permissoes.nao_enviada,
                    nao_preenchida: nao_preenchida,
                },
                {
                    eh_corrente: false,
                    periodo: r.data_anterior,
                    series: anterior,
                    pode_editar: config.perfil !== 'ponto_focal',
                },
            ];
        }

        return {
            ordem_series,
            seriesPorVariavel: seriesPorVariavel,
        };
    }

    private calculaPermissoesSerieCorrente(
        config: PessoaAcessoPdm,
        status: { aguarda_complementacao: boolean; aguarda_cp: boolean; variavel_id: number; conferida: boolean } | null,
        porVariavelIdDataSerie: any,
        idVariavel: number,
        dataReferencia: DateYMD,
        metaEstaFaseColeta: boolean,
    ) {
        // verifica apenas se existe valor
        const existeSerieValorRealizado =
            porVariavelIdDataSerie[idVariavel] &&
                porVariavelIdDataSerie[idVariavel][dataReferencia] &&
                porVariavelIdDataSerie[idVariavel][dataReferencia].Realizado &&
                porVariavelIdDataSerie[idVariavel][dataReferencia].Realizado.valor_nominal !== ''
                ? true
                : false;

        // se ja foi conferida, ou se já aguarda CP, claramente já foi enviada
        // verifica se já foi enviada (se ta conferida, já foi enviada alguma vez)
        // se ta aguardando_cp, tbm já foi enviado
        // se tem valor, então suponhamos que não foi enviada ainda mas já foi preenchida
        const nao_enviada = (status && status.conferida === true) || (status && status.aguarda_cp === true) ? false : existeSerieValorRealizado;

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
                    todasConferidas = false;
                }
            }
        }
        // se nao tem valor, nao tem conferencia
        if (!existeValorRealizado) todasConferidas = false;

        if (config.perfil == 'ponto_focal') {
            return {
                todasConferidas: todasConferidas,
                ha_valor: existeSerieValorRealizado,
                nao_enviada: nao_enviada,
                pode_editar: status ? (status.aguarda_complementacao ? true : status.aguarda_cp || status.conferida ? false : metaEstaFaseColeta) : metaEstaFaseColeta,
            };
        } else {
            return {
                todasConferidas: todasConferidas,
                ha_valor: existeSerieValorRealizado,
                nao_enviada: nao_enviada,
                pode_editar: true,
            };
        }
    }

    private pushSerieVariavel(serieValores: SerieValorNomimal[], porVariavelIdDataSerie: any, idVariavel: number, dataReferencia: DateYMD, ehCorrente: boolean, serie: Serie) {
        const existeSerieValor =
            porVariavelIdDataSerie[idVariavel] && porVariavelIdDataSerie[idVariavel][dataReferencia] && porVariavelIdDataSerie[idVariavel][dataReferencia][serie]
                ? porVariavelIdDataSerie[idVariavel][dataReferencia][serie]
                : undefined;
        if (existeSerieValor) {
            serieValores.push({
                data_valor: Date2YMD.toString(existeSerieValor.data_valor),
                referencia: '',
                valor_nominal: existeSerieValor.valor_nominal.toString(),
                conferida: existeSerieValor.conferida,
            });
        } else {
            serieValores.push({
                data_valor: dataReferencia,
                referencia: '',
                valor_nominal: '',
                conferida: ehCorrente ? false : true, // -- datas no passado sao sempre conferidas
            });
        }
    }

    private async buscaSeriesValores(map: VariavelDetalhePorID, ciclo: CicloAtivoDto) {
        const seriesVariavel: { data_corrente: string; data_anterior: string; variavel_id: number }[] = await this.prisma.$queryRaw`select
            (cte.data - (atraso_meses || 'month')::interval)::date::text as data_corrente,
            (cte.data - (atraso_meses || 'month')::interval - periodicidade_intervalo(periodicidade))::date::text as data_anterior,
            id as variavel_id
        from
            (select ${Date2YMD.toString(ciclo.data_ciclo)}::date as data) cte,
            variavel v
        where v.id = ANY(${Object.keys(map)}::int[])
        `;

        const conditions: { variavel_id: number; data_valor: Date }[] = [];
        for (const variavel of seriesVariavel) {
            conditions.push({
                variavel_id: variavel.variavel_id,
                data_valor: Date2YMD.fromString(variavel.data_anterior),
            });
            conditions.push({
                variavel_id: variavel.variavel_id,
                data_valor: Date2YMD.fromString(variavel.data_corrente),
            });
        }

        return {
            seriesValores: await this.prisma.serieVariavel.findMany({
                where: { OR: conditions },
                select: {
                    data_valor: true,
                    serie: true,
                    valor_nominal: true,
                    conferida: true,
                    variavel_id: true,
                },
            }),
            seriesVariavel: seriesVariavel,
        };
    }

    private async statusVariaveisDb(map: VariavelDetalhePorID, ciclo: CicloAtivoDto) {
        return await this.prisma.statusVariavelCicloFisico.findMany({
            where: {
                variavel_id: { in: Object.keys(map).map(n => +n) },
                ciclo_fisico_id: ciclo.id,
            },
            select: {
                aguarda_complementacao: true,
                aguarda_cp: true,
                variavel_id: true,
                conferida: true,
            },
        });
    }

    private async getAtividades(meta_id: number, dadosMeta: DadosMetaIndicadores[]) {
        return await this.prisma.atividade.findMany({
            where: {
                removido_em: null,
                Indicador: {
                    some: {
                        id: {
                            in: dadosMeta.filter(r => r.atividade_id !== null).map(r => r.indicador_id),
                        },
                    },
                },
            },
            select: {
                titulo: true,
                id: true,
                codigo: true,
                Indicador: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true,
                    },
                },
                iniciativa_id: true,
                atividade_responsavel: {
                    select: {
                        pessoa: {
                            select: {
                                nome_exibicao: true,
                            },
                        },
                        orgao: {
                            select: {
                                sigla: true,
                            },
                        },
                        coordenador_responsavel_cp: true,
                    },
                },
            },
        });
    }

    private async getIniciativas(meta_id: number, dadosMeta: DadosMetaIndicadores[]) {
        console.log({ dadosMeta, ini: dadosMeta.filter(r => r.iniciativa_id !== null).map(r => r.indicador_id) });

        return await this.prisma.iniciativa.findMany({
            where: {
                meta_id: meta_id,
                removido_em: null,
                Indicador: {
                    some: {
                        id: {
                            in: dadosMeta.filter(r => r.iniciativa_id !== null).map(r => r.indicador_id),
                        },
                    },
                },
            },
            select: {
                titulo: true,
                id: true,
                codigo: true,
                Indicador: {
                    where: {
                        removido_em: null,
                    },
                    select: { id: true, titulo: true, codigo: true },
                },
                iniciativa_responsavel: {
                    select: {
                        pessoa: {
                            select: {
                                nome_exibicao: true,
                            },
                        },
                        orgao: {
                            select: {
                                sigla: true,
                            },
                        },
                        coordenador_responsavel_cp: true,
                    },
                },
            },
        });
    }

    private async getVariaveisMeta(meta_id: number, inIds: number[]) {
        const map: VariavelDetalhePorID = {};
        const variaveis_da_meta = await this.prisma.variavel.findMany({
            where: {
                id: { in: inIds },
                indicador_variavel: {
                    some: {
                        desativado_em: null,
                        indicador_origem: null,
                        indicador: {
                            meta_id: meta_id,
                            removido_em: null,
                        },
                    },
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
                                meta_id: true,
                            },
                        },
                    },
                },
            },
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
                                removido_em: null,
                            },
                        },
                    },
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
                                iniciativa_id: true,
                            },
                        },
                    },
                },
            },
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
                                    removido_em: null,
                                },
                            },
                        },
                    },
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
                                atividade_id: true,
                            },
                        },
                    },
                },
            },
        });
        for (const r of variaveis_da_atividade) {
            map[r.id] = r;
        }

        return map;
    }

    async addMetaVariavelAnaliseQualitativaDocumento(dto: VariavelAnaliseQualitativaDocumentoDto, config: PessoaAcessoPdm, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto.variavel_id, meta_id);

        if (config.perfil == 'ponto_focal' && !dadosCiclo.ativo) {
            throw new HttpException('Você não pode enviar valores fora de um ciclo ainda ativo.', 400);
        }

        const id = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
            const uploadId = this.uploadService.checkUploadToken(dto.upload_token);

            const cfq = await prismaTxn.variavelCicloFisicoDocumento.create({
                data: {
                    ciclo_fisico_id: dadosCiclo.id,
                    variavel_id: dto.variavel_id,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: dto.data_valor,
                    meta_id: meta_id,
                    arquivo_id: uploadId,
                },
                select: { id: true },
            });

            return cfq.id;
        });

        return { id: id };
    }

    async deleteMetaVariavelAnaliseQualitativaDocumento(id: number, config: PessoaAcessoPdm, user: PessoaFromJwt) {
        const arquivo = await this.prisma.variavelCicloFisicoDocumento.findFirst({
            where: {
                id: id,
                removido_em: null,
            },
        });
        if (!arquivo) throw new HttpException('404', 404);

        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(arquivo.referencia_data);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(arquivo.variavel_id, this.prisma);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, arquivo.variavel_id, meta_id);

        if (config.perfil == 'ponto_focal' && !dadosCiclo.ativo) {
            throw new HttpException('Você não pode enviar valores fora de um ciclo ainda ativo.', 400);
        }

        await this.prisma.variavelCicloFisicoDocumento.update({
            where: { id: id },
            data: { removido_em: now, removido_por: user.id },
        });
    }

    async addVariavelConferida(dto: VariavelConferidaDto, config: PessoaAcessoPdm, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto.variavel_id, meta_id);
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode conferir valores', 400);
        }

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            // isolation lock
            await prismaTxn.variavel.findFirst({ where: { id: dto.variavel_id }, select: { id: true } });

            let needRecalc = false;
            for (const campo of CamposRealizado) {
                const existeValor = await this.prisma.serieVariavel.findFirst({
                    where: {
                        variavel_id: dto.variavel_id,
                        serie: CamposRealizadoParaSerie[campo],
                        data_valor: dto.data_valor,
                        conferida: false,
                    },
                    select: { id: true },
                });

                if (existeValor) {
                    // existe o valor, entao vamos ativar
                    needRecalc = true;

                    await this.prisma.serieVariavel.update({
                        where: { id: existeValor.id },
                        data: {
                            conferida_em: now,
                            conferida_por: user.id,
                            ciclo_fisico_id: dadosCiclo.id,
                            conferida: true,
                        },
                    });
                }
            }

            if (needRecalc) {
                await this.variavelService.recalc_variaveis_acumulada([dto.variavel_id], prismaTxn);
                await this.variavelService.recalc_indicador_usando_variaveis([dto.variavel_id], prismaTxn);
            }

            await this.removeStatusVariavel(prismaTxn, dto, dadosCiclo);
            await prismaTxn.statusVariavelCicloFisico.create({
                data: {
                    ciclo_fisico_id: dadosCiclo.id,
                    variavel_id: dto.variavel_id,
                    meta_id: meta_id,
                    // marcando que foi conferida, mesmo que o valor não exista na serie-variavel
                    conferida: true,
                    aguarda_cp: false,
                },
            });

            await this.mfService.invalidaStatusIndicador(prismaTxn, dadosCiclo.id, meta_id);
        });
    }

    private async removeStatusVariavel(prismaTxn: Prisma.TransactionClient, dto: VariavelConferidaDto, dadosCiclo: DadosCiclo) {
        await prismaTxn.statusVariavelCicloFisico.deleteMany({
            where: {
                variavel_id: dto.variavel_id,
                ciclo_fisico_id: dadosCiclo.id,
            },
        });
    }

    async addVariavelPedidoComplementacao(dto: VariavelComplementacaoDto, config: PessoaAcessoPdm, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto.variavel_id, meta_id);
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode pedir por complementação', 400);
        }
        if (!dadosCiclo.ativo) {
            throw new HttpException('Não é possível solicitar complementação para ciclos não ativos.', 400);
        }

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {

            await prismaTxn.pedidoComplementacao.updateMany({
                where: {
                    ciclo_fisico_id: dadosCiclo.id,
                    variavel_id: dto.variavel_id,
                    ultima_revisao: true,
                },
                data: {
                    ultima_revisao: false,
                },
            });

            await prismaTxn.pedidoComplementacao.create({
                data: {
                    ciclo_fisico_id: dadosCiclo.id,
                    variavel_id: dto.variavel_id,
                    pedido: dto.pedido,
                    ultima_revisao: true,
                    criado_por: user.id,
                    criado_em: now,
                    atendido: false,
                },
            });

            await this.removeStatusVariavel(prismaTxn, dto, dadosCiclo);
            await prismaTxn.statusVariavelCicloFisico.create({
                data: {
                    ciclo_fisico_id: dadosCiclo.id,
                    variavel_id: dto.variavel_id,
                    meta_id: meta_id,
                    aguarda_cp: false,
                    aguarda_complementacao: true,
                },
            });

            await this.mfService.invalidaStatusIndicador(prismaTxn, dadosCiclo.id, meta_id);
        });
    }

    async addMetaVariavelAnaliseQualitativa(dto: VariavelAnaliseQualitativaDto, config: PessoaAcessoPdm, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto.variavel_id, meta_id);
        let ehPontoFocal = config.perfil == 'ponto_focal';

        if (ehPontoFocal && !dadosCiclo.ativo) {
            throw new HttpException('Você não pode enviar valores fora de um ciclo ativo.', 400);
        }
        // se nao é o ponto_focal, pode simular virar um
        if (!ehPontoFocal && dto.simular_ponto_focal) {
            ehPontoFocal = true;
        }

        if (dto.enviar_para_cp && !ehPontoFocal) {
            throw new HttpException(`Não é possível enviar para cp, pois o seu perfil é ${config.perfil}, e os valores já entram conferidos.`, 400);
        }

        const status = await this.prisma.statusVariavelCicloFisico.findFirst({
            where: {
                variavel_id: dto.variavel_id,
                ciclo_fisico_id: dadosCiclo.id,
            },
            select: { aguarda_complementacao: true },
        });

        if (ehPontoFocal && dadosCiclo.meta_esta_na_coleta == false && (!status || status.aguarda_complementacao == false)) {
            throw new HttpException('Você não pode enviar valores fora da fase de Coleta se não há pedido de complementação', 400);
        }

        // o trabalho pra montar um SerieJwt não faz sentido
        // então vamos operar diretamente na SerieVariavel
        const id = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
                // isolation lock
                await prismaTxn.variavel.findFirst({ where: { id: dto.variavel_id }, select: { id: true } });

                let needRecalc = false;
                for (const campo of CamposRealizado) {
                    const valor_nominal = dto[campo] === null ? '' : dto[campo];
                    if (valor_nominal === undefined) continue;

                    const existeValor = await prismaTxn.serieVariavel.findFirst({
                        where: {
                            variavel_id: dto.variavel_id,
                            serie: CamposRealizadoParaSerie[campo],
                            data_valor: dto.data_valor,
                        },
                        select: { id: true, valor_nominal: true, ciclo_fisico_id: true },
                    });

                    if (existeValor && valor_nominal === '') {
                        // existe o valor, mas é pra remover, então bora
                        needRecalc = true;

                        await prismaTxn.serieVariavel.delete({
                            where: {
                                id: existeValor.id,
                            },
                        });
                    } else if (!existeValor && valor_nominal !== '') {
                        // valor não existe, entao vamos criar
                        needRecalc = true;

                        await prismaTxn.serieVariavel.create({
                            data: {
                                variavel_id: dto.variavel_id,
                                serie: CamposRealizadoParaSerie[campo],
                                data_valor: dto.data_valor,
                                valor_nominal: valor_nominal,
                                atualizado_em: now,
                                atualizado_por: user.id,
                                ciclo_fisico_id: dadosCiclo.id,
                                conferida: ehPontoFocal ? false : true,
                            },
                        });
                    } else if (existeValor && valor_nominal !== '') {
                        const valorModificado = existeValor.valor_nominal.toString() !== valor_nominal;
                        // se os valores mudaram, ou se faltava o ciclo_fisico_id
                        if (valorModificado || existeValor.ciclo_fisico_id === null) {
                            needRecalc = true;

                            await prismaTxn.serieVariavel.update({
                                where: { id: existeValor.id },
                                data: {
                                    valor_nominal: valor_nominal,
                                    atualizado_em: now,
                                    atualizado_por: user.id,
                                    ciclo_fisico_id: dadosCiclo.id,
                                    conferida: valorModificado ? (ehPontoFocal ? false : true) : undefined,
                                },
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
                        ultima_revisao: true,
                    },
                    data: {
                        ultima_revisao: false,
                    },
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
                        enviado_para_cp: dto.enviar_para_cp === true,
                    },
                    select: { id: true },
                });

                if (dto.enviar_para_cp) {
                    await prismaTxn.pedidoComplementacao.updateMany({
                        where: {
                            ciclo_fisico_id: dadosCiclo.id,
                            variavel_id: dto.variavel_id,
                            ultima_revisao: true,
                            atendido: false,
                        },
                        data: {
                            atendido_em: now,
                            atendido: true,
                            atendido_por: user.id,
                        },
                    });

                    await this.removeStatusVariavel(prismaTxn, dto, dadosCiclo);
                    await prismaTxn.statusVariavelCicloFisico.create({
                        data: {
                            variavel_id: dto.variavel_id,
                            ciclo_fisico_id: dadosCiclo.id,
                            aguarda_cp: true,
                            meta_id: meta_id,
                        },
                    });
                } else {
                    if (ehPontoFocal == false) {
                        // limpa o pedido de complementacao, se existir
                        await prismaTxn.pedidoComplementacao.updateMany({
                            where: {
                                ciclo_fisico_id: dadosCiclo.id,
                                variavel_id: dto.variavel_id,
                                ultima_revisao: true,
                                atendido: false,
                            },
                            data: {
                                atendido_em: now,
                                atendido: true,
                                atendido_por: user.id,
                            },
                        });

                        await this.removeStatusVariavel(prismaTxn, dto, dadosCiclo);
                        // ja marca como conferida, nao há aguarda CP para os admins
                        await prismaTxn.statusVariavelCicloFisico.create({
                            data: {
                                variavel_id: dto.variavel_id,
                                ciclo_fisico_id: dadosCiclo.id,
                                meta_id: meta_id,
                                conferida: true,
                            },
                        });
                    }
                }

                await this.mfService.invalidaStatusIndicador(prismaTxn, dadosCiclo.id, meta_id);

                return cfq.id;
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000,
            },
        );

        return { id: id };
    }

    async getMetaVariavelAnaliseQualitativa(
        dto: FilterVariavelAnaliseQualitativaDto,
        config: PessoaAcessoPdm,
        user: PessoaFromJwt,
        apenasSV: boolean = false
    ): Promise<MfListVariavelAnaliseQualitativaDto> {
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto.variavel_id, meta_id);

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
                        descricao: true,
                    },
                },
                regiao: {
                    select: {
                        id: true,
                        descricao: true,
                    },
                },
                casas_decimais: true,
                acumulativa: true,
                periodicidade: true,
            },
        });

        const ordem_series: Serie[] = ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'];
        shuffleArray(ordem_series); // garante que o consumidor não está usando os valores das series cegamente

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
            },
        });
        const seriesValoresBySerie: Record<string, (typeof serieValores)[0]> = {};
        for (const r of serieValores) {
            seriesValoresBySerie[r.serie] = r;
        }

        const series: MfSerieValorNomimal[] = ordem_series.map(serie => {
            const existe = seriesValoresBySerie[serie];
            if (existe)
                return {
                    data_valor: dateYMD,
                    conferida: existe.conferida,
                    valor_nominal: existe.valor_nominal.toString(),
                };

            return {
                data_valor: dateYMD,
                conferida: false,
                valor_nominal: '',
            };
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
                    select: { nome_exibicao: true },
                },
                id: true,
            },
        });

        const arquivosResult = apenasSV ? [] : await this.prisma.variavelCicloFisicoDocumento.findMany({
            where: {
                ciclo_fisico_id: dadosCiclo.id,
                variavel_id: dto.variavel_id,
                removido_em: null,
            },
            orderBy: {
                criado_em: 'desc',
            },
            select: {
                criado_em: true,
                pessoaCriador: {
                    select: { nome_exibicao: true },
                },
                id: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        TipoDocumento: true,
                        descricao: true,
                        nome_original: true,
                    },
                },
            },
        });

        const pedido = apenasSV ? null : await this.prisma.pedidoComplementacao.findFirst({
            where: {
                ciclo_fisico_id: dadosCiclo.id,
                variavel_id: dto.variavel_id,
                ultima_revisao: true,
            },
            select: {
                ultima_revisao: true,
                pedido: true,
                atendido: true,
                criado_em: true,
                pessoaCriador: {
                    select: { nome_exibicao: true },
                },
                id: true,
            },
        });

        return {
            ultimoPedidoComplementacao: pedido
                ? {
                    pedido: pedido.pedido || '',
                    criado_em: pedido.criado_em,
                    id: pedido.id,
                    criador: { nome_exibicao: pedido.pessoaCriador.nome_exibicao },
                    atendido: pedido.atendido,
                }
                : null,
            arquivos: arquivosResult.map(r => {
                return {
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                    criado_em: r.criado_em,
                    arquivo: { ...r.arquivo, ...this.uploadService.getDownloadToken(r.arquivo.id, '180 minutes') },
                };
            }),
            analises: analisesResult.map(r => {
                return {
                    analise_qualitativa: r.analise_qualitativa || '',
                    ultima_revisao: r.ultima_revisao,
                    criado_em: r.criado_em,
                    meta_id: r.meta_id,
                    enviado_para_cp: r.enviado_para_cp,
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                };
            }),
            ordem_series: ordem_series,
            series: series,
            variavel: variavel,
        };
    }

    private async capturaDadosCicloVariavel(dateYMD: string, variavel_id: number, meta_id: number) {
        const dadosCicloResult: DadosCiclo[] = await this.prisma.$queryRaw`
            select
                variavel_participa_do_ciclo( v.id, ${dateYMD}::date ) as "variavelParticipa",
                cf.ativo as ativo,
                cf.id as id,
                (
                    select (
                        select cff.ciclo_fase
                        from meta m
                        join ciclo_fisico_fase cff on cff.id = m.ciclo_fase_id
                        where m.id = ${meta_id}
                    )
                ) = 'Coleta'::"CicloFase" as meta_esta_na_coleta
            from ciclo_fisico cf,
            variavel v
            where v.id = ${variavel_id}::int
            AND cf.data_ciclo = ${dateYMD}::date + (v.atraso_meses || ' month')::interval
            and cf.pdm_id = (select pdm_id from meta where id = ${meta_id})
        `;
        const dadosCiclo = dadosCicloResult[0];
        console.log(dadosCiclo);
        if (!dadosCiclo) throw new HttpException(`Ciclo não encontrado no PDM`, 404);
        if (!dadosCiclo.variavelParticipa) throw new HttpException(`Nenhum ciclo encontrado para preenchimento em ${dateYMD} na variável ${variavel_id}`, 400);
        return dadosCiclo;
    }

    async mudarMetaCicloFase(meta_id: number, dto: CicloFaseDto, config: PessoaAcessoPdm, cf: CicloAtivoDto, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        if (config.perfil == 'ponto_focal') throw new HttpException('Função não está disponível', 400);

        const meta = await this.prisma.meta.findFirst({
            where: {
                id: meta_id,
            },
            select: {
                ciclo_fase: {
                    select: {
                        data_inicio: true,
                        id: true,
                        ciclo_fase: true,
                    },
                },
            },
        });
        if (!meta) throw new HttpException('Meta não encontrada', 404);
        if (!meta.ciclo_fase) throw new HttpException('Meta não tem uma fase de atualmente', 404);

        const cicloFase = await this.prisma.cicloFisicoFase.findFirst({
            where: {
                id: dto.ciclo_fase_id,
                ciclo_fisico_id: cf.id,
            },
            select: {
                data_inicio: true,
                ciclo_fase: true,
                id: true,
            },
        });
        if (!cicloFase) throw new HttpException('Fase não encontrada', 404);

        // nada pra fazer, já está na fase desejada
        if (cicloFase.id == meta.ciclo_fase.id) return;

        if (Date2YMD.toString(meta.ciclo_fase.data_inicio) > Date2YMD.toString(cicloFase.data_inicio)) {
            throw new HttpException(`A meta está na fase ${meta.ciclo_fase.ciclo_fase} e não pode retroceder para ${cicloFase.ciclo_fase}`, 400);
        }

        await this.prisma.meta.update({
            where: {
                id: meta_id,
            },
            data: {
                ciclo_fase_id: cicloFase.id,
                atualizado_em: now,
                atualizado_por: user.id,
            },
        });
    }
}
