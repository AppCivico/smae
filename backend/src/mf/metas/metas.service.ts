import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { CicloFase, Prisma, Serie } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from '../../common/date2ymd';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { BatchRecordWithId, RecordWithId } from '../../common/dto/record-with-id.dto';
import { SeriesArrayShuffle } from '../../common/shuffleArray';
import { PrismaService } from '../../prisma/prisma.service';
import { ArquivoBaseDto } from '../../upload/dto/create-upload.dto';
import { UploadService } from '../../upload/upload.service';
import { SerieValorNomimal } from '../../variavel/entities/variavel.entity';
import { VariavelComCategorica, VariavelService } from '../../variavel/variavel.service';
import { MfPessoaAcessoPdm, MfService } from './../mf.service';
import {
    CamposAcumulado,
    CamposRealizado,
    CamposRealizadoParaSerie,
    CicloAtivoDto,
    CicloFaseDto,
    FilterFormulaCompostaAnaliseQualitativaDto,
    FilterMfMetasDto,
    FilterVariavelAnaliseQualitativaDto,
    FilterVariavelAnaliseQualitativaEmLoteDto,
    FilterVariavelAnaliseQualitativaUltimaRevisaoDto,
    FormulaCompostaAnaliseQualitativaDocumentoDto,
    FormulaCompostaAnaliseQualitativaDto,
    IniciativasRetorno,
    MfAvancarFasesDto,
    MfFasesPermissoesDto,
    MfListFormulaCompostaAnaliseQualitativaDto,
    MfListVariavelAnaliseQualitativaDto,
    MfListVariavelAnaliseQualitativaEmLoteDto,
    MfListVariavelAnaliseQualitativaReducedDto,
    MfMetaDto,
    MfSerieValorNomimal,
    MfSeriesAgrupadas,
    RetornoMetaVariaveisDto,
    VariavelAnaliseQualitativaDocumentoDto,
    VariavelAnaliseQualitativaDto,
    VariavelAnaliseQualitativaEmLoteDto,
    VariavelComSeries,
    VariavelComplementacaoDto,
    VariavelConferidaDto,
    VariavelPedidoComplementacaoEmLoteDto,
    VariavelQtdeDto,
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
    variavel_categorica_id: number | null;
    acumulativa: boolean;
    casas_decimais: number;
    indicador_variavel: {
        indicador: {
            iniciativa_id?: number | null;
            atividade_id?: number | null;
            meta_id?: number | null;
        };
    }[];
    variavel_formula_composta: IdTituloDto[];
};

type SerieseTotais = {
    totais: VariavelQtdeDto;
    variaveis: VariavelComSeries[];
};

export const TEMPO_EXPIRACAO_ARQUIVO = '180 minutes';
type VariavelDetalhePorID = Record<number, VariavelDetalhe>;

@Injectable()
export class MetasService {
    private readonly logger = new Logger(MetasService.name);

    constructor(
        private readonly variavelService: VariavelService,
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly mfService: MfService
    ) {}

    async metas(config: MfPessoaAcessoPdm, cicloAtivoId: number, params: FilterMfMetasDto): Promise<MfMetaDto[]> {
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
                await this.prisma
                    .$queryRaw`select atualiza_status_meta_pessoa(${r.id}::int, ${config.pessoa_id}::int, ${cicloAtivoId}::int)`;
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
            const statusMeta = metasStatusPorMeta[r.id] ? 'true' : 'false';
            out.push({
                status_ciclo_fase: params.ciclo_fase ? labelsPorStatus[params.ciclo_fase][statusMeta] : undefined,
                fase: r.ciclo_fase?.ciclo_fase || '(sem fase)',
                codigo: r.codigo,
                id: r.id,
                titulo: r.titulo,
                codigo_organizacoes: r.meta_orgao
                    ? r.meta_orgao.map((e) => e.orgao.sigla || e.orgao.descricao)
                    : ['Sem Organização'],
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
        fieldMatch: number
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
                    variavel: {
                        id: variavel.id,
                        codigo: variavel.codigo,
                        titulo: variavel.titulo,
                        acumulativa: variavel.acumulativa,
                        casas_decimais: variavel.casas_decimais,
                        variavel_categorica_id: variavel.variavel_categorica_id,
                    },
                    variavel_formula_composta: variavel.variavel_formula_composta,
                    series: seriesPorVariavel[+varId],
                });
            }
        }

        // dessa forma ta fácil mudar pra código
        // TODO: conferir se vai ficar por titulo ou por codigo
        seriesDaX.sort((a, b) => a.variavel.titulo.localeCompare(b.variavel.titulo));

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

    async metaVariaveis(
        meta_id: number,
        config: MfPessoaAcessoPdm,
        cicloFisicoAtivo: CicloAtivoDto,
        user: PessoaFromJwt,
        mesAnterior: boolean
    ): Promise<RetornoMetaVariaveisDto> {
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

        const calcSerieVariaveis = await this.calcSerieVariaveis(
            variaveisMeta,
            config,
            cicloFisicoAtivo,
            metaEstaFaseColeta,
            mesAnterior
        );

        const cicloFase = indicadorMeta.meta.ciclo_fase?.ciclo_fase ? indicadorMeta.meta.ciclo_fase?.ciclo_fase : '';

        const retorno: RetornoMetaVariaveisDto = {
            data_ciclo: cicloFisicoAtivo.data_ciclo,
            perfil: config.perfil,
            ordem_series: calcSerieVariaveis.ordem_series,
            meta: {
                indicador: indicadorMeta,
                iniciativas: [],
                ...this.extraiVariaveis(variaveisMeta, calcSerieVariaveis.seriesPorVariavel, 'meta_id', meta_id),
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

        if (this.calcPodeEnviarCp(retorno.meta.totais) && config.perfil === 'ponto_focal')
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
                ...this.extraiVariaveis(
                    variaveisMeta,
                    calcSerieVariaveis.seriesPorVariavel,
                    'iniciativa_id',
                    iniciativa.id
                ),
            };

            if (this.calcPodeEnviarCp(retornoIniciativa.totais) && config.perfil === 'ponto_focal')
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
                    ...this.extraiVariaveis(
                        variaveisMeta,
                        calcSerieVariaveis.seriesPorVariavel,
                        'atividade_id',
                        atividade.id
                    ),
                };

                if (atv.variaveis.length > 0) {
                    retornoIniciativa.atividades.push(atv);
                    atividadesComVarCount++;

                    if (this.calcPodeEnviarCp(atv.totais) && config.perfil === 'ponto_focal')
                        retorno.botao_enviar_cp = true;
                }
            }

            if (atividadesComVarCount > 0) retorno.meta.iniciativas.push(retornoIniciativa);
        }

        return retorno;
    }

    private calcPodeEnviarCp(totais: { nao_enviadas: number; aguarda_complementacao: number }) {
        return totais.nao_enviadas > 0 || totais.aguarda_complementacao > 0;
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
        config: MfPessoaAcessoPdm,
        ciclo: CicloAtivoDto,
        metaEstaFaseColeta: boolean,
        mesAnterior: boolean
    ): Promise<{
        ordem_series: Serie[];
        seriesPorVariavel: Record<number, MfSeriesAgrupadas[]>;
    }> {
        const [statusVariaveisCorrente, buscaSerieValoresResult] = await Promise.all([
            this.statusVariaveisDb(map, ciclo),
            this.buscaSeriesValores(map, ciclo, mesAnterior),
        ]);

        const statusPorVariavel: Record<number, (typeof statusVariaveisCorrente)[0] | null> = {};
        for (const r of statusVariaveisCorrente) {
            statusPorVariavel[r.variavel_id] = r;
        }

        // retorna uma lista com cada variavel com o mes do ciclo corrente e o ciclo anterior
        // e se existir valores, vem junto (todas as series)
        const seriesVariavel = buscaSerieValoresResult.seriesVariavel;
        const seriesValores = buscaSerieValoresResult.seriesValores;

        // map pra variavel, depois a data, depois a serie
        const porVariavelIdDataSerie: Record<
            number,
            Record<DateYMD, Record<Serie, (typeof seriesValores)[0] | null>>
        > = {};
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
        SeriesArrayShuffle(ordem_series); // garante que o consumidor não está usando os valores das series cegamente

        const seriesPorVariavel: Record<number, MfSeriesAgrupadas[]> = {};
        for (const r of seriesVariavel) {
            const variavel = map[r.variavel_id];
            const status = statusPorVariavel[r.variavel_id];

            const corrente: SerieValorNomimal[] = [];

            for (const serie of ordem_series) {
                this.pushSerieVariavel(corrente, porVariavelIdDataSerie, variavel.id, r.data_corrente, true, serie);
            }

            const anterior: SerieValorNomimal[] = [];
            if (mesAnterior) {
                for (const serie of ordem_series) {
                    this.pushSerieVariavel(
                        anterior,
                        porVariavelIdDataSerie,
                        variavel.id,
                        r.data_anterior,
                        false,
                        serie
                    );
                }
            }

            const permissoes = this.calculaPermissoesSerieCorrente(
                config,
                status,
                porVariavelIdDataSerie,
                variavel.id,
                r.data_corrente,
                metaEstaFaseColeta
            );

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
            ];

            if (mesAnterior) {
                seriesPorVariavel[variavel.id].push({
                    eh_corrente: false,
                    periodo: r.data_anterior,
                    series: anterior,
                    pode_editar: config.perfil !== 'ponto_focal',
                });
            }
        }

        return {
            ordem_series,
            seriesPorVariavel: seriesPorVariavel,
        };
    }

    private calculaPermissoesSerieCorrente(
        config: MfPessoaAcessoPdm,
        status: {
            aguarda_complementacao: boolean;
            aguarda_cp: boolean;
            variavel_id: number;
            conferida: boolean;
        } | null,
        porVariavelIdDataSerie: any,
        idVariavel: number,
        dataReferencia: DateYMD,
        metaEstaFaseColeta: boolean
    ) {
        // verifica apenas se existe valor
        const existeSerieValorRealizado =
            porVariavelIdDataSerie[idVariavel] &&
            porVariavelIdDataSerie[idVariavel][dataReferencia] &&
            porVariavelIdDataSerie[idVariavel][dataReferencia].Realizado &&
            porVariavelIdDataSerie[idVariavel][dataReferencia].Realizado.valor_nominal !== ''
                ? true
                : false;

        const nao_enviada = calcNaoEnviada();

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
                pode_editar: calcPodeEditarPontoFocal(),
            };
        } else {
            return {
                todasConferidas: todasConferidas,
                ha_valor: existeSerieValorRealizado,
                nao_enviada: nao_enviada,
                pode_editar: true,
            };
        }

        function calcNaoEnviada(): boolean {
            // se não tem status, nunca teve envio pela tela do Monitoramento/PDM,
            // vamos trabalhar o status pela existência do valor da serie Realizado
            // então suponhamos que não foi enviada ainda mas já foi preenchida
            if (!status) return existeSerieValorRealizado;

            // se aguarda complementação, não ta enviada
            if (status.aguarda_complementacao) return true;

            // se ja foi conferida, ou se já aguarda CP, claramente já foi enviada
            // verifica se já foi enviada (se ta conferida, já foi enviada alguma vez)
            return status.conferida === true || status.aguarda_cp === true;
        }

        function calcPodeEditarPontoFocal(): boolean {
            if (!status) return metaEstaFaseColeta;

            if (status.aguarda_complementacao) return true;

            if (status.aguarda_cp || status.conferida) return false;

            return metaEstaFaseColeta;
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
        const existeSerieValor =
            porVariavelIdDataSerie[idVariavel] &&
            porVariavelIdDataSerie[idVariavel][dataReferencia] &&
            porVariavelIdDataSerie[idVariavel][dataReferencia][serie]
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

    private async buscaSeriesValores(map: VariavelDetalhePorID, ciclo: CicloAtivoDto, mesAnterior: boolean) {
        const seriesVariavel: { data_corrente: string; data_anterior: string; variavel_id: number }[] = await this
            .prisma.$queryRaw`select
            (cte.data - (atraso_meses || 'month')::interval)::date::text as data_corrente,
            (cte.data - (atraso_meses || 'month')::interval - periodicidade_intervalo(periodicidade))::date::text as data_anterior,
            id as variavel_id
        from
            (select ${ciclo.data_ciclo}::date as data) cte,
            variavel v
        where v.id = ANY(${Object.keys(map)}::int[])
        `;

        const conditions: { variavel_id: number; data_valor: Date }[] = [];
        for (const variavel of seriesVariavel) {
            conditions.push({
                variavel_id: variavel.variavel_id,
                data_valor: Date2YMD.fromString(variavel.data_corrente),
            });

            if (mesAnterior)
                conditions.push({
                    variavel_id: variavel.variavel_id,
                    data_valor: Date2YMD.fromString(variavel.data_anterior),
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
                variavel_id: { in: Object.keys(map).map((n) => +n) },
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
                            in: dadosMeta.filter((r) => r.atividade_id !== null).map((r) => r.indicador_id),
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
        //console.log({ dadosMeta, ini: dadosMeta.filter((r) => r.iniciativa_id !== null).map((r) => r.indicador_id) });

        return await this.prisma.iniciativa.findMany({
            where: {
                meta_id: meta_id,
                removido_em: null,
                Indicador: {
                    some: {
                        id: {
                            in: dadosMeta.filter((r) => r.iniciativa_id !== null).map((r) => r.indicador_id),
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
                acumulativa: true,
                variavel_categorica_id: true,
                casas_decimais: true,
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
                FormulaCompostaVariavel: {
                    where: {
                        formula_composta: {
                            removido_em: null,
                            mostrar_monitoramento: true,
                        },
                    },
                    select: {
                        formula_composta: {
                            select: {
                                id: true,
                                titulo: true,
                            },
                        },
                    },
                },
            },
        });

        for (const r of variaveis_da_meta) {
            map[r.id] = { ...r, variavel_formula_composta: r.FormulaCompostaVariavel.map((r) => r.formula_composta) };
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
                acumulativa: true,
                variavel_categorica_id: true,
                casas_decimais: true,
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
                FormulaCompostaVariavel: {
                    where: {
                        formula_composta: {
                            removido_em: null,
                            mostrar_monitoramento: true,
                        },
                    },
                    select: {
                        id: true,
                        referencia: true,
                        formula_composta: {
                            select: {
                                id: true,
                                titulo: true,
                            },
                        },
                    },
                },
            },
        });
        for (const r of variaveis_da_iniciativa) {
            map[r.id] = { ...r, variavel_formula_composta: r.FormulaCompostaVariavel.map((r) => r.formula_composta) };
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
                acumulativa: true,
                variavel_categorica_id: true,
                casas_decimais: true,
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
                FormulaCompostaVariavel: {
                    where: {
                        formula_composta: {
                            removido_em: null,
                            mostrar_monitoramento: true,
                        },
                    },
                    select: {
                        id: true,
                        referencia: true,
                        formula_composta: {
                            select: {
                                id: true,
                                titulo: true,
                            },
                        },
                    },
                },
            },
        });
        for (const r of variaveis_da_atividade) {
            map[r.id] = { ...r, variavel_formula_composta: r.FormulaCompostaVariavel.map((r) => r.formula_composta) };
        }

        return map;
    }

    async addMetaVariavelAnaliseQualitativaDocumento(
        dto: VariavelAnaliseQualitativaDocumentoDto,
        config: MfPessoaAcessoPdm,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);
        this.verificaPermissaoMeta(config, meta_id);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto.variavel_id, meta_id);

        if (config.perfil == 'ponto_focal' && !dadosCiclo.ativo) {
            throw new HttpException('Você não pode enviar valores fora de um ciclo ainda ativo.', 400);
        }

        const id = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
            const uploadId = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);

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

    async deleteMetaVariavelAnaliseQualitativaDocumento(id: number, config: MfPessoaAcessoPdm, user: PessoaFromJwt) {
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
        this.verificaPermissaoMeta(config, meta_id);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, arquivo.variavel_id, meta_id);

        if (config.perfil == 'ponto_focal' && !dadosCiclo.ativo) {
            throw new HttpException('Você não pode enviar valores fora de um ciclo ainda ativo.', 400);
        }

        await this.prisma.variavelCicloFisicoDocumento.update({
            where: { id: id },
            data: { removido_em: now, removido_por: user.id },
        });
    }

    async addVariavelConferida(dto: VariavelConferidaDto, config: MfPessoaAcessoPdm, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);
        this.verificaPermissaoMeta(config, meta_id);

        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto.variavel_id, meta_id);
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode conferir valores', 400);
        }

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            // isolation lock
            const variavel = await prismaTxn.variavel.findFirstOrThrow({
                where: { id: dto.variavel_id },
                select: { id: true, acumulativa: true },
            });

            let needRecalc = false;
            for (const campo of CamposRealizado) {
                const existeValor = await prismaTxn.serieVariavel.findFirst({
                    where: {
                        variavel_id: dto.variavel_id,
                        serie: CamposRealizadoParaSerie[campo],
                        data_valor: dto.data_valor,
                    },
                    select: { id: true, conferida: true, valor_nominal: true },
                });

                if (!existeValor)
                    throw new HttpException('Não existe valor para conferir, ou o valor foi modificado.', 400);

                if (existeValor.conferida) continue;

                if (campo == 'valor_realizado_acumulado' && !variavel.acumulativa) continue;

                // existe o valor, entao vamos ativar
                needRecalc = true;

                await prismaTxn.serieVariavel.update({
                    where: { id: existeValor.id },
                    data: {
                        conferida_em: now,
                        conferida_por: user.id,
                        ciclo_fisico_id: dadosCiclo.id,
                        conferida: true,
                    },
                });

                if (!variavel.acumulativa) {
                    const acumulado = await prismaTxn.serieVariavel.findFirst({
                        where: {
                            variavel_id: dto.variavel_id,
                            serie: CamposRealizadoParaSerie['valor_realizado_acumulado'],
                            data_valor: dto.data_valor,
                        },
                        select: { id: true, conferida: true },
                    });

                    if (acumulado && !acumulado.conferida) {
                        await prismaTxn.serieVariavel.update({
                            where: { id: acumulado.id },
                            data: {
                                conferida_em: now,
                                conferida_por: user.id,
                                ciclo_fisico_id: dadosCiclo.id,
                                conferida: true,
                            },
                        });
                    } else if (!acumulado) {
                        await prismaTxn.serieVariavel.create({
                            data: {
                                valor_nominal: existeValor.valor_nominal,
                                variavel_id: dto.variavel_id,
                                serie: CamposRealizadoParaSerie['valor_realizado_acumulado'],
                                data_valor: dto.data_valor,
                                conferida_em: now,
                                conferida_por: user.id,
                                ciclo_fisico_id: dadosCiclo.id,
                                conferida: true,
                            },
                        });
                    }
                }
            }

            if (needRecalc) {
                await this.variavelService.recalc_series_dependentes([dto.variavel_id], prismaTxn);
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

    private async removeStatusVariavel(
        prismaTxn: Prisma.TransactionClient,
        dto: VariavelConferidaDto,
        dadosCiclo: DadosCiclo
    ) {
        await prismaTxn.statusVariavelCicloFisico.deleteMany({
            where: {
                variavel_id: dto.variavel_id,
                ciclo_fisico_id: dadosCiclo.id,
            },
        });
    }

    async addVariavelPedidoComplementacao(
        dto: VariavelComplementacaoDto,
        config: MfPessoaAcessoPdm,
        user: PessoaFromJwt
    ) {
        const now = new Date(Date.now());
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const meta_id = await this.variavelService.getMetaIdDaVariavel(dto.variavel_id, this.prisma);
        this.verificaPermissaoMeta(config, meta_id);

        const dadosCiclo = await this.verificaPermissaoPedidoComplementacao(dateYMD, dto, meta_id, config);

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            await this.performPedidoComplementacao(prismaTxn, dadosCiclo, dto, user, now, meta_id);
        });
    }

    private async performPedidoComplementacao(
        prismaTxn: Prisma.TransactionClient,
        dadosCiclo: DadosCiclo,
        dto: VariavelComplementacaoDto,
        user: PessoaFromJwt,
        now: Date,
        meta_id: number
    ) {
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
    }

    private async verificaPermissaoPedidoComplementacao(
        dateYMD: string,
        dto: VariavelComplementacaoDto,
        meta_id: number,
        config: {
            id: number;
            pessoa_id: number;
            metas_cronograma: number[];
            metas_variaveis: number[];
            variaveis: number[];
            cronogramas_etapas: number[];
            data_ciclo: Date | null;
            perfil: string;
        }
    ) {
        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, dto.variavel_id, meta_id);
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode pedir por complementação', 400);
        }
        if (!dadosCiclo.ativo) {
            throw new HttpException('Não é possível solicitar complementação para ciclos não ativos.', 400);
        }
        return dadosCiclo;
    }

    async addVariavelPedidoComplementacaoEmLote(
        dto: VariavelPedidoComplementacaoEmLoteDto,
        config: MfPessoaAcessoPdm,
        user: PessoaFromJwt
    ): Promise<void> {
        const now = new Date(Date.now());

        const batchResultados: {
            dadosCiclo: DadosCiclo;
            meta_id: number;
        }[] = [];

        for (const linha of dto.linhas) {
            const dateYMD = Date2YMD.toString(linha.data_valor);
            const meta_id = await this.variavelService.getMetaIdDaVariavel(linha.variavel_id, this.prisma);
            const dadosCiclo = await this.verificaPermissaoPedidoComplementacao(dateYMD, linha, meta_id, config);

            this.verificaPermissaoMeta(config, meta_id);

            batchResultados.push({ dadosCiclo, meta_id });
        }

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            for (let i = 0; i < dto.linhas.length; i++) {
                const linha = dto.linhas[i];
                const { dadosCiclo, meta_id } = batchResultados[i];
                await this.performPedidoComplementacao(prismaTxn, dadosCiclo, linha, user, now, meta_id);
            }
        });
    }

    async addMetaVariavelAnaliseQualitativa(
        dto: VariavelAnaliseQualitativaDto,
        config: MfPessoaAcessoPdm,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const { dadosCiclo, ehPontoFocal, meta_id } = await this.buscaDadosCiclo(dto, config);
        this.verificaPermissaoMeta(config, meta_id);

        // o trabalho pra montar um SerieJwt não faz sentido
        // então vamos operar diretamente na SerieVariavel
        const id = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
                // isolation lock
                const variavelInfo = await this.variavelService.loadVariavelComCategorica(
                    'PDM',
                    prismaTxn,
                    dto.variavel_id
                );

                const needRecalc = await this.atualizaSerieVariaveis(
                    variavelInfo,
                    dto,
                    prismaTxn,
                    now,
                    user,
                    dadosCiclo,
                    ehPontoFocal
                );
                if (needRecalc) {
                    await this.variavelService.recalc_series_dependentes([dto.variavel_id], prismaTxn);
                    await this.variavelService.recalc_indicador_usando_variaveis([dto.variavel_id], prismaTxn);
                }

                const cfq = await this.atualizaStatusVariavelCicloFisico(
                    prismaTxn,
                    dadosCiclo,
                    dto,
                    user,
                    now,
                    meta_id,
                    ehPontoFocal
                );

                await this.mfService.invalidaStatusIndicador(prismaTxn, dadosCiclo.id, meta_id);

                return cfq.id;
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000,
            }
        );

        return { id: id };
    }

    private async buscaDadosCiclo(dto: VariavelAnaliseQualitativaDto, config: MfPessoaAcessoPdm) {
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
            throw new HttpException(
                `Não é possível enviar para cp, pois o seu perfil é ${config.perfil}, e os valores já entram conferidos.`,
                400
            );
        }

        const status = await this.prisma.statusVariavelCicloFisico.findFirst({
            where: {
                variavel_id: dto.variavel_id,
                ciclo_fisico_id: dadosCiclo.id,
                meta_id: meta_id, // nem tão importante assim, pois a variavel já é de só um indicador -> meta
            },
            select: { aguarda_complementacao: true },
        });

        if (
            ehPontoFocal &&
            ((status && status.aguarda_complementacao === false) ||
                (!status && dadosCiclo.meta_esta_na_coleta === false))
        ) {
            throw new HttpException(
                'Você não pode enviar valores fora da fase de Coleta se não há pedido de complementação',
                400
            );
        }
        return { dadosCiclo, ehPontoFocal, meta_id };
    }

    async addMetaVariavelAnaliseQualitativaEmLote(
        dto: VariavelAnaliseQualitativaEmLoteDto,
        config: MfPessoaAcessoPdm,
        user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        const now = new Date(Date.now());

        const batchResultados: {
            dadosCiclo: DadosCiclo;
            ehPontoFocal: boolean;
            meta_id: number;
        }[] = [];

        for (const linha of dto.linhas) {
            const { dadosCiclo, ehPontoFocal, meta_id } = await this.buscaDadosCiclo(
                {
                    simular_ponto_focal: dto.simular_ponto_focal,
                    ...linha,
                },
                config
            );
            this.verificaPermissaoMeta(config, meta_id);

            batchResultados.push({ dadosCiclo, ehPontoFocal, meta_id });
        }

        // se não deu nenhuma exception no loop acima, então segue com a transaction pro banco

        const updatedIds = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<BatchRecordWithId> => {
                // isolation lock

                const needRecalcVars: number[] = [];
                const batchResult: BatchRecordWithId = { ids: [] };

                for (let i = 0; i < dto.linhas.length; i++) {
                    const linha = dto.linhas[i];

                    const { dadosCiclo, ehPontoFocal, meta_id } = batchResultados[i];

                    const variavelInfo = await this.variavelService.loadVariavelComCategorica(
                        'PDM',
                        prismaTxn,
                        linha.variavel_id
                    );

                    const needRecalc = await this.atualizaSerieVariaveis(
                        variavelInfo,
                        {
                            simular_ponto_focal: dto.simular_ponto_focal,
                            ...linha,
                        },
                        prismaTxn,
                        now,
                        user,
                        dadosCiclo,
                        ehPontoFocal
                    );
                    if (needRecalc) needRecalcVars.push(linha.variavel_id);

                    const cfq = await this.atualizaStatusVariavelCicloFisico(
                        prismaTxn,
                        dadosCiclo,
                        {
                            simular_ponto_focal: dto.simular_ponto_focal,
                            ...linha,
                        },
                        user,
                        now,
                        meta_id,
                        ehPontoFocal
                    );

                    batchResult.ids.push(cfq);

                    await this.mfService.invalidaStatusIndicador(prismaTxn, dadosCiclo.id, meta_id);
                }

                if (needRecalcVars.length > 0) {
                    await this.variavelService.recalc_series_dependentes(needRecalcVars, prismaTxn);
                    await this.variavelService.recalc_indicador_usando_variaveis(needRecalcVars, prismaTxn);
                }

                return batchResult;
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000 * 5,
            }
        );

        return updatedIds;
    }

    private async atualizaSerieVariaveis(
        variavelInfo: VariavelComCategorica,
        dto: VariavelAnaliseQualitativaDto,
        prismaTxn: Prisma.TransactionClient,
        now: Date,
        user: PessoaFromJwt,
        dadosCiclo: DadosCiclo,
        ehPontoFocal: boolean
    ) {
        let needRecalc = false;
        for (const campo of CamposRealizado) {
            const valor_nominal = dto[campo] === null ? '' : dto[campo];
            if (valor_nominal === undefined) continue;

            if (variavelInfo.acumulativa && CamposAcumulado.includes(campo)) {
                this.logger.debug(`Variável é acumulativa, então não atualiza o campo ${campo}`);
                continue;
            }

            let variavel_categorica_valor_id: number | null = null;

            if (variavelInfo.variavel_categorica) {
                const valorExiste = variavelInfo.variavel_categorica.valores.find(
                    (v) => v.valor_variavel === +valor_nominal
                );
                if (!valorExiste)
                    throw new HttpException(`Valor ${valor_nominal} não é permitido para a variável categórica`, 400);
                variavel_categorica_valor_id = valorExiste.id;
            }

            const existeValor = await prismaTxn.serieVariavel.findFirst({
                where: {
                    variavel_id: dto.variavel_id,
                    serie: CamposRealizadoParaSerie[campo],
                    data_valor: dto.data_valor,
                },
                select: { id: true, valor_nominal: true, ciclo_fisico_id: true, conferida: true },
            });

            const novoConferida = ehPontoFocal ? false : true;

            if (existeValor && valor_nominal === '') {
                // existe o valor, mas é pra remover, então bora
                needRecalc = true;

                await prismaTxn.serieVariavel.delete({
                    where: {
                        id: existeValor.id,
                    },
                });
            } else if (!existeValor && valor_nominal !== '') {
                // valor não existe, então vamos criar
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
                        conferida: novoConferida,
                        variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                        variavel_categorica_valor_id: variavel_categorica_valor_id,
                    },
                });
            } else if (existeValor && valor_nominal !== '') {
                const valorModificado = existeValor.valor_nominal.toString() !== valor_nominal;
                // se os valores mudaram, ou se faltava o ciclo_fisico_id
                if (
                    valorModificado ||
                    existeValor.ciclo_fisico_id === null ||
                    existeValor.conferida !== novoConferida
                ) {
                    needRecalc = true;

                    await prismaTxn.serieVariavel.update({
                        where: { id: existeValor.id },
                        data: {
                            valor_nominal: valor_nominal,
                            atualizado_em: now,
                            atualizado_por: user.id,
                            ciclo_fisico_id: dadosCiclo.id,
                            conferida: novoConferida,
                            variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                            variavel_categorica_valor_id: variavel_categorica_valor_id,
                        },
                    });
                }

                // TODO: know issue: se a variavel não é acumulativa, precisa atualizar o acumulado pra espelhar
                // assim como nos outros casos onde há mudança na serie-variavel, por isso que gosto de triggers...
            }
        }
        return needRecalc;
    }

    private async atualizaStatusVariavelCicloFisico(
        prismaTxn: Prisma.TransactionClient,
        dadosCiclo: DadosCiclo,
        dto: VariavelAnaliseQualitativaDto,
        user: PessoaFromJwt,
        now: Date,
        meta_id: number,
        ehPontoFocal: boolean
    ) {
        await prismaTxn.variavelCicloFisicoQualitativo.updateMany({
            where: {
                ciclo_fisico_id: dadosCiclo.id,
                variavel_id: dto.variavel_id,
                meta_id: meta_id,
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
        return cfq;
    }

    async getMetaVariavelAnaliseQualitativa(
        dto: FilterVariavelAnaliseQualitativaDto,
        user: PessoaFromJwt,
        fastlane = false
    ): Promise<MfListVariavelAnaliseQualitativaDto> {
        const dateYMD = Date2YMD.toString(dto.data_valor);
        const linha = await this.processLinha(dto, !!dto.apenas_ultima_revisao, fastlane);

        const ordem_series: Serie[] = ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'];
        SeriesArrayShuffle(ordem_series); // garante que o consumidor não está usando os valores das series cegamente

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

        const series: MfSerieValorNomimal[] = ordem_series.map((serie) => {
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

        return {
            ...linha,
            ordem_series: ordem_series,
            series: series,
        };
    }

    async getMetaVariavelAnaliseQualitativaEmLote(
        dto: FilterVariavelAnaliseQualitativaEmLoteDto,
        user: PessoaFromJwt
    ): Promise<MfListVariavelAnaliseQualitativaEmLoteDto> {
        const promises: Promise<MfListVariavelAnaliseQualitativaReducedDto>[] = [];

        for (const linha of dto.linhas) {
            promises.push(this.processLinha(linha, true, false));
        }

        const ret = await Promise.all(promises);

        return { linhas: ret };
    }

    private async processLinha(
        linha: FilterVariavelAnaliseQualitativaUltimaRevisaoDto,
        apenas_ultima_revisao: boolean,
        fastlane: boolean
    ): Promise<MfListVariavelAnaliseQualitativaReducedDto> {
        const meta_id = await this.variavelService.getMetaIdDaVariavel(linha.variavel_id, this.prisma);
        const dateYMD = Date2YMD.toString(linha.data_valor);
        const dadosCiclo = await this.capturaDadosCicloVariavel(dateYMD, linha.variavel_id, meta_id);

        const variavel = await this.carregaVariavel({ variavel_id: linha.variavel_id });

        const [analisesResult, arquivosResult, pedido] = await Promise.all([
            // analise qualitativa não pode ficar no fastlane, pois é usado no submeter em lote (que usa o fastlane)
            // e não quer os arquivos nem pedido complementação
            this.buscaAnalisesQualitativas(dadosCiclo, {
                variavel_id: linha.variavel_id,
                apenas_ultima_revisao,
            }),
            fastlane ? null : this.buscaArquivos(dadosCiclo, { variavel_id: linha.variavel_id }),
            fastlane ? null : this.buscaPedidoComplementacao(dadosCiclo, { variavel_id: linha.variavel_id }),
        ]);

        return {
            variavel: variavel,
            ultimoPedidoComplementacao: pedido
                ? {
                      pedido: pedido.pedido || '',
                      criado_em: pedido.criado_em,
                      id: pedido.id,
                      criador: { nome_exibicao: pedido.pessoaCriador.nome_exibicao },
                      atendido: pedido.atendido,
                  }
                : null,
            arquivos: arquivosResult
                ? arquivosResult.map((r) => {
                      return {
                          id: r.id,
                          criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                          criado_em: r.criado_em,
                          arquivo: {
                              ...r.arquivo,
                              descricao: null,
                              ...this.uploadService.getDownloadToken(r.arquivo.id, TEMPO_EXPIRACAO_ARQUIVO),
                          } satisfies ArquivoBaseDto,
                      };
                  })
                : [],
            analises: analisesResult
                ? analisesResult.map((r) => {
                      return {
                          analise_qualitativa: r.analise_qualitativa || '',
                          ultima_revisao: r.ultima_revisao,
                          criado_em: r.criado_em,
                          meta_id: r.meta_id,
                          enviado_para_cp: r.enviado_para_cp,
                          id: r.id,
                          criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                      };
                  })
                : [],
        };
    }

    private async buscaPedidoComplementacao(dadosCiclo: DadosCiclo, dto: { variavel_id: number }) {
        return await this.prisma.pedidoComplementacao.findFirst({
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
    }

    private async buscaArquivos(dadosCiclo: DadosCiclo, dto: { variavel_id: number }) {
        return await this.prisma.variavelCicloFisicoDocumento.findMany({
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
                        nome_original: true,
                        diretorio_caminho: true,
                    },
                },
            },
        });
    }

    private async buscaAnalisesQualitativas(
        dadosCiclo: DadosCiclo,
        dto: { variavel_id: number; apenas_ultima_revisao?: boolean }
    ) {
        return await this.prisma.variavelCicloFisicoQualitativo.findMany({
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
    }

    private async carregaVariavel(dto: { variavel_id: number }) {
        return await this.prisma.variavel.findFirstOrThrow({
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

        if (!dadosCiclo) throw new HttpException(`Ciclo não encontrado no PDM`, 404);
        if (!dadosCiclo.variavelParticipa)
            throw new HttpException(
                `Nenhum ciclo encontrado para preenchimento em ${dateYMD} na variável ${variavel_id}`,
                400
            );
        return dadosCiclo;
    }

    async mudarMetaCicloFase(
        meta_id: number,
        dto: CicloFaseDto,
        config: MfPessoaAcessoPdm,
        cf: CicloAtivoDto,
        user: PessoaFromJwt
    ) {
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
        this.verificaPermissaoMeta(config, meta_id);

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
            throw new HttpException(
                `A meta está na fase ${meta.ciclo_fase.ciclo_fase} e não pode retroceder para ${cicloFase.ciclo_fase}`,
                400
            );
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

    async addMetaFormulaCompostaAnaliseQualitativa(
        dto: FormulaCompostaAnaliseQualitativaDto,
        config: MfPessoaAcessoPdm,
        cicloAtivo: CicloAtivoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const now = new Date(Date.now());

        if (Date2YMD.dbDateToDMY(dto.data_ciclo) != Date2YMD.ymdToDMY(cicloAtivo.data_ciclo))
            throw new BadRequestException(
                `Você só pode enviar análises para o ciclo ativo, ${Date2YMD.ymdToDMY(cicloAtivo.data_ciclo)}`
            );

        const meta_id = await this.variavelService.getMetaIdDaFormulaComposta(dto.formula_composta_id, this.prisma);
        this.verificaPermissaoMeta(config, meta_id);

        const id = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
                // se salvar o mesmo form, exatamente igual, não gera outro registro
                const alreadyExists = await prismaTxn.formulaCompostaCicloFisicoQualitativo.findFirst({
                    where: {
                        ciclo_fisico_id: cicloAtivo.id,
                        formula_composta_id: dto.formula_composta_id,
                        meta_id: meta_id,
                        analise_qualitativa: dto.analise_qualitativa || '',
                        enviado_para_cp: !!dto.enviar_para_cp,
                        criado_por: user.id,
                        removido_em: null,
                        ultima_revisao: true,
                    },
                });
                if (alreadyExists) return alreadyExists.id;

                await prismaTxn.formulaCompostaCicloFisicoQualitativo.updateMany({
                    where: {
                        ciclo_fisico_id: cicloAtivo.id,
                        formula_composta_id: dto.formula_composta_id,
                        meta_id: meta_id,
                        removido_em: null,
                        ultima_revisao: true,
                    },
                    data: {
                        ultima_revisao: false,
                    },
                });
                const cfq = await prismaTxn.formulaCompostaCicloFisicoQualitativo.create({
                    data: {
                        ciclo_fisico_id: cicloAtivo.id,
                        formula_composta_id: dto.formula_composta_id,
                        meta_id: meta_id,
                        ultima_revisao: true,
                        criado_por: user.id,
                        criado_em: now,
                        enviado_para_cp: !!dto.enviar_para_cp,
                        referencia_data: cicloAtivo.data_ciclo,
                        analise_qualitativa: dto.analise_qualitativa || '',
                    },
                });

                return cfq.id;
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000,
            }
        );

        return { id: id };
    }

    async getMetaFormulaCompostaAnaliseQualitativa(
        dto: FilterFormulaCompostaAnaliseQualitativaDto,
        config: MfPessoaAcessoPdm,
        user: PessoaFromJwt
    ): Promise<MfListFormulaCompostaAnaliseQualitativaDto> {
        const formula_composta = await this.prisma.formulaComposta.findFirstOrThrow({
            where: {
                removido_em: null,
                id: dto.formula_composta_id,
            },
            select: { id: true, titulo: true },
        });

        const analisesResult = await this.prisma.formulaCompostaCicloFisicoQualitativo.findMany({
            where: {
                referencia_data: dto.data_ciclo,
                formula_composta_id: formula_composta.id,
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

        const arquivosResult = await this.prisma.formulaCompostaCicloFisicoDocumento.findMany({
            where: {
                referencia_data: dto.data_ciclo,
                formula_composta_id: formula_composta.id,
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
                        nome_original: true,
                        diretorio_caminho: true,
                    },
                },
            },
        });

        const ret: MfListFormulaCompostaAnaliseQualitativaDto = {
            formula_composta: { id: formula_composta.id, titulo: formula_composta.titulo },
            analises: analisesResult.map((r) => {
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
            arquivos: arquivosResult.map((r) => {
                return {
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                    criado_em: r.criado_em,
                    arquivo: {
                        ...r.arquivo,
                        descricao: null,
                        ...this.uploadService.getDownloadToken(r.arquivo.id, TEMPO_EXPIRACAO_ARQUIVO),
                    } satisfies ArquivoBaseDto,
                };
            }),
        };

        return ret;
    }

    async addMetaFormulaCompostaAnaliseQualitativaDocumento(
        dto: FormulaCompostaAnaliseQualitativaDocumentoDto,
        config: MfPessoaAcessoPdm,
        cicloAtivo: CicloAtivoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const now = new Date(Date.now());

        if (Date2YMD.dbDateToDMY(dto.data_ciclo) != Date2YMD.ymdToDMY(cicloAtivo.data_ciclo))
            throw new BadRequestException(
                `Você só pode enviar análises para o ciclo ativo, ${Date2YMD.ymdToDMY(cicloAtivo.data_ciclo)}`
            );

        const meta_id = await this.variavelService.getMetaIdDaFormulaComposta(dto.formula_composta_id, this.prisma);
        this.verificaPermissaoMeta(config, meta_id);

        const id = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
            const uploadId = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);

            const cfq = await prismaTxn.formulaCompostaCicloFisicoDocumento.create({
                data: {
                    ciclo_fisico_id: cicloAtivo.id,
                    formula_composta_id: dto.formula_composta_id,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: dto.data_ciclo,
                    meta_id: meta_id,
                    arquivo_id: uploadId,
                },
                select: { id: true },
            });

            return cfq.id;
        });

        return { id: id };
    }

    async deleteMetaFormulaCompostaAnaliseQualitativaDocumento(
        id: number,
        config: MfPessoaAcessoPdm,
        cicloAtivo: CicloAtivoDto,
        user: PessoaFromJwt
    ) {
        const now = new Date(Date.now());
        const arquivo = await this.prisma.formulaCompostaCicloFisicoDocumento.findFirst({
            where: {
                id: id,
                ciclo_fisico_id: cicloAtivo.id,
                removido_em: null,
            },
        });
        if (!arquivo) throw new HttpException('404', 404);

        const meta_id = await this.variavelService.getMetaIdDaFormulaComposta(arquivo.formula_composta_id, this.prisma);
        this.verificaPermissaoMeta(config, meta_id);

        await this.prisma.formulaCompostaCicloFisicoDocumento.updateMany({
            where: { id: id, meta_id, removido_em: null },
            data: { removido_em: now, removido_por: user.id },
        });
    }

    private verificaPermissaoMeta(
        config: {
            id: number;
            pessoa_id: number;
            metas_cronograma: number[];
            metas_variaveis: number[];
            variaveis: number[];
            cronogramas_etapas: number[];
            data_ciclo: Date | null;
            perfil: string;
        },
        meta_id: number
    ) {
        if (config.metas_variaveis.includes(meta_id) === false)
            throw new BadRequestException('Você não pode editar esta meta');
    }
}
