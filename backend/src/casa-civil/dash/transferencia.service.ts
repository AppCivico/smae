import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { NotaService } from '../../bloco-nota/nota/nota.service';
import {
    AnyPageTokenJwtBody,
    PaginatedDto,
    PaginatedWithPagesDto,
    PAGINATION_TOKEN_TTL,
} from '../../common/dto/paginated.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferenciaService } from '../transferencia/transferencia.service';
import { FilterDashNotasDto, MfDashNotasDto } from './dto/notas.dto';
import {
    DashAnaliseTranferenciasChartsDto,
    DashTransferenciaBasicChartDto,
    DashTransferenciasPainelEstrategicoDto,
    FilterDashTransferenciasAnaliseDto,
    FilterDashTransferenciasDto,
    FilterDashTransferenciasPainelEstrategicoDto,
    FilterDashTransferenciasWorkflowDto,
    ListMfDashTransferenciasDto,
    MfDashTransferenciasDto,
} from './dto/transferencia.dto';
import { Prisma, TransferenciaTipoEsfera } from '@prisma/client';
import { UploadService } from 'src/upload/upload.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Date2YMD } from '../../common/date2ymd';
import { Object2Hash } from 'src/common/object2hash';

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}
@Injectable()
export class DashTransferenciaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly transferenciaService: TransferenciaService,
        private readonly jwtService: JwtService,
        private readonly notaService: NotaService,
        private readonly uploadService: UploadService
    ) {}

    async transferencias(
        filter: FilterDashTransferenciasDto,
        user: PessoaFromJwt
    ): Promise<ListMfDashTransferenciasDto> {
        // Construir condições de busca combinada (identificador + palavras-chave)
        const searchConditions = await this.transferenciaService.buildSearchConditions(filter.palavra_chave);

        // eh marco, ter data de termino (ter data planejado), não ter data de termino real
        //
        const rows = await this.prisma.transferenciaStatusConsolidado.findMany({
            where: {
                orgaos_envolvidos: filter.orgaos_ids ? { hasSome: filter.orgaos_ids } : undefined,
                situacao: filter.atividade ? { in: filter.atividade } : undefined,
                // Filtro "prazo" é em dias, então caso seja passado 60. Buscamos transferencias que a data seja menor ou igual a hoje + 60 dias
                data: filter.prazo ? { lte: new Date(Date.now() + filter.prazo * 24 * 60 * 60 * 1000) } : undefined,
                transferencia: {
                    AND: this.transferenciaService.permissionSet(user),
                    esfera: filter.esfera ? { in: filter.esfera } : undefined,
                    // Busca combinada por identificador e palavras-chave
                    ...(searchConditions ? { OR: searchConditions } : {}),
                    parlamentar: filter.partido_ids
                        ? {
                              some: {
                                  partido_id: { in: filter.partido_ids },
                              },
                          }
                        : undefined,
                },
            },
            include: {
                transferencia: {
                    select: {
                        id: true,
                        identificador: true,
                        emenda: true,
                        esfera: true,
                        objeto: true,
                        parlamentar: {
                            select: {
                                partido_id: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ data: { sort: 'asc', nulls: 'first' } }, { transferencia: { identificador: 'asc' } }],
        });

        const ret: ListMfDashTransferenciasDto = {
            linhas: rows.map((r): MfDashTransferenciasDto => {
                return {
                    data: Date2YMD.toStringOrNull(r.data),
                    data_origem: r.data_origem,
                    atividade: r.situacao,
                    identificador: r.transferencia.identificador,
                    emenda: r.transferencia.emenda,
                    transferencia_id: r.transferencia.id,
                    esfera: r.transferencia.esfera,
                    orgaos: r.orgaos_envolvidos,
                    objeto: r.transferencia.objeto,
                    partido_ids: r.transferencia.parlamentar.length
                        ? r.transferencia.parlamentar.map((p) => p.partido_id!)
                        : null,
                };
            }),
        };

        return ret;
    }

    async notas(filters: FilterDashNotasDto, user: PessoaFromJwt): Promise<PaginatedDto<MfDashNotasDto>> {
        // Construir condições de busca combinada (identificador + palavras-chave)
        const searchConditions = await this.transferenciaService.buildSearchConditions(filters.palavra_chave);

        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const rows = await this.prisma.viewNotasTransferencias.findMany({
            where: {
                status: {
                    in: ['Em_Curso', 'Programado'],
                },
                removido_em: null,
                notaReferencia: {
                    status: {
                        in: ['Em_Curso', 'Programado'],
                    },
                    removido_em: null,
                    AND: this.notaService.permissionSet(user),
                },
                transferencia: {
                    AND: this.transferenciaService.permissionSet(user),
                    removido_em: null,
                    esfera: filters.esfera ? { in: filters.esfera } : undefined,
                    // Busca combinada por identificador e palavras-chave
                    ...(searchConditions ? { OR: searchConditions } : {}),

                    parlamentar: filters.partido_ids
                        ? { some: { partido_id: { in: filters.partido_ids } } }
                        : undefined,

                    TransferenciaStatusConsolidado:
                        filters.orgaos_ids || filters.atividade
                            ? {
                                  some: {
                                      orgaos_envolvidos: filters.orgaos_ids
                                          ? { hasSome: filters.orgaos_ids }
                                          : undefined,
                                      situacao: filters.atividade ? { in: filters.atividade } : undefined,
                                  },
                              }
                            : undefined,
                },
            },
            orderBy: [{ data_ordenacao: 'desc' }],
            skip: offset,
            take: ipp + 1,
        });

        const linhas = rows.map((r) => {
            return {
                transferencia_id: r.transferencia_id,
                nota_id: r.id,
                bloco_id: r.bloco_nota_id,
                nota: r.nota,
                data_nota: r.data_nota,
                data_ordenacao: r.data_ordenacao,
                status: r.status,
                transferencia_identificador: r.transferencia_identificador,
            };
        });

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        return {
            tem_mais: tem_mais,
            token_ttl: PAGINATION_TOKEN_TTL,
            token_proxima_pagina: token_proxima_pagina,
            linhas,
        };
    }

    async analiseTransferenciasFormattedCharts(
        filter: FilterDashTransferenciasAnaliseDto,
        user: PessoaFromJwt
    ): Promise<DashAnaliseTranferenciasChartsDto> {
        const rows = await this.prisma.viewTransferenciaAnalise.findMany({
            where: {
                parlamentar_id: filter.parlamentar_ids ? { hasSome: filter.parlamentar_ids } : undefined,
                ano: filter.anos ? { in: filter.anos } : undefined,
                partido_id: filter.partido_ids ? { hasSome: filter.partido_ids } : undefined,
                workflow_etapa_atual_id: filter.etapa_ids ? { in: filter.etapa_ids } : undefined,
            },
            include: {
                transferencia: {
                    include: {
                        workflow_fase_atual: {
                            select: {
                                fase: true, // if null, set 'Workflow Não Iniciado'
                            },
                        },
                        parlamentar: {
                            select: {
                                parlamentar_id: true,
                                valor: true,
                                partido_id: true,
                                partido: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        nome: true,
                                        numero: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const partidosRows = await this.prisma.partido.findMany({
            where: {
                id: { in: rows.flatMap((r) => r.partido_id).filter((id) => id != null) },
            },
            select: {
                id: true,
                sigla: true,
            },
        });

        const uniqueTransferencias = rows.filter((elem, index, self) => {
            return index === self.findIndex((t) => t.transferencia_id === elem.transferencia_id);
        });

        const dadosPorPartidoDistribuicao = (() => {
            const partidoData = new Map<
                string,
                {
                    sigla: string;
                    fases: Map<string, number>;
                    total: number;
                }
            >();

            uniqueTransferencias.forEach((transferencia) => {
                const fase = transferencia.transferencia.workflow_fase_atual?.fase || 'Workflow Não Iniciado';
                transferencia.transferencia.parlamentar.forEach((parlamentar) => {
                    if (parlamentar.valor && Number(parlamentar.valor) > 0) {
                        let partidoSigla = 'N/A';
                        if (parlamentar.partido_id) {
                            const partido = partidosRows.find((p) => p.id === parlamentar.partido_id);
                            partidoSigla = partido?.sigla || 'N/A';
                        }

                        if (!partidoData.has(partidoSigla)) {
                            partidoData.set(partidoSigla, {
                                sigla: partidoSigla,
                                fases: new Map<string, number>(),
                                total: 0,
                            });
                        }

                        const partido = partidoData.get(partidoSigla)!;
                        const valor = Number(parlamentar.valor);

                        // Adiciona o valor à fase correspondente
                        const currentPhaseValue = partido.fases.get(fase) || 0;
                        partido.fases.set(fase, currentPhaseValue + valor);

                        // soma o valor total do partido
                        partido.total += valor;
                    }
                });
            });

            return Array.from(partidoData.values());
        })();

        // Pega todas as fases únicas de todas as transferências
        const fasesUnicas = Array.from(
            new Set(
                uniqueTransferencias.flatMap((t) =>
                    t.transferencia.workflow_fase_atual?.fase
                        ? [t.transferencia.workflow_fase_atual.fase]
                        : ['Workflow Não Iniciado']
                )
            )
        );

        const valorTotal: number = uniqueTransferencias.reduce((sum, current) => sum + +current.valor_total, 0);

        const countAll: number = uniqueTransferencias.length;
        const chartPorEsfera: DashTransferenciaBasicChartDto = {
            title: {
                id: 'chart__Esferas',
                text: 'Percentual do valor por esfera',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            xAxis: {
                type: 'category',
                data: ['Federal', 'Estadual'],
            },
            yAxis: {
                type: 'value',
            },
            series: [
                {
                    type: 'bar',
                    barWidth: '20%',
                    data: [
                        {
                            value: uniqueTransferencias.length
                                ? (
                                      (100 *
                                          uniqueTransferencias
                                              .filter((e) => e.esfera == TransferenciaTipoEsfera.Federal)
                                              .reduce((sum, current) => sum + +current.valor_total, 0)) /
                                      valorTotal
                                  ).toFixed(2)
                                : '0',
                            itemStyle: { color: '#C6C1FB' },
                        },
                        {
                            value: uniqueTransferencias.length
                                ? (
                                      (100 *
                                          uniqueTransferencias
                                              .filter((e) => e.esfera == TransferenciaTipoEsfera.Estadual)
                                              .reduce((sum, current) => sum + +current.valor_total, 0)) /
                                      valorTotal
                                  ).toFixed(2)
                                : '0',
                            itemStyle: { color: '#372EA2' },
                        },
                    ],
                },
            ],
        };

        const chartPorStatus: DashTransferenciaBasicChartDto = {
            title: {
                id: 'chart__Status',
                text: 'Distribuição de transferências',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            xAxis: { type: 'value' },
            yAxis: {
                type: 'category',
                data: ['Concluídas', 'Em Andamento', 'Disponibilizadas'],
            },
            series: [
                {
                    type: 'bar',
                    barWidth: '20%',
                    data: [
                        {
                            value: uniqueTransferencias.filter((e) => e.workflow_finalizado == true).length.toString(),
                            itemStyle: { color: '#B5E48C' },
                        },
                        {
                            value: uniqueTransferencias.filter((e) => e.workflow_finalizado == false).length.toString(),
                            itemStyle: { color: '#76C893' },
                        },
                        {
                            value: countAll.toString(),
                            itemStyle: { color: '#4F8562' },
                        },
                    ],
                },
            ],
        };

        const dadosPorPartido = partidosRows.map((partido) => {
            const etapasSoma = uniqueTransferencias
                .filter((r) => r.partido_id.includes(partido.id) && r.workflow_etapa_atual_id !== null)
                .reduce(
                    (acc, curr) => {
                        const etapaId = curr.workflow_etapa_atual_id!;

                        // Distribuição pode ter múltiplos parlamentares, e com partidos diferentes ou iguais.
                        const valor = curr.transferencia.parlamentar
                            .filter((p) => p.partido?.id == partido.id)
                            .reduce((sum, current) => sum.add(current.valor ?? Decimal(0)), Decimal(0));

                        if (Number.isNaN(valor) || valor === undefined || valor === null)
                            throw new InternalServerErrorException(
                                'Valor não encontrado para o partido: ' + partido.sigla
                            );

                        const existingObjIndex = acc.findIndex((obj) => obj.workflow_etapa_atual_id === etapaId);

                        if (existingObjIndex !== -1) {
                            acc[existingObjIndex].sum += Number(valor);
                        } else {
                            acc.push({ workflow_etapa_atual_id: etapaId, sum: Number(valor) });
                        }
                        return acc;
                    },
                    [] as { workflow_etapa_atual_id: number; sum: number }[]
                );

            return {
                sigla: partido.sigla,
                count_estadual: uniqueTransferencias
                    .filter((r) => r.partido_id.includes(partido.id))
                    .filter((r) => r.esfera == TransferenciaTipoEsfera.Estadual).length,
                count_federal: uniqueTransferencias
                    .filter((r) => r.partido_id.includes(partido.id))
                    .filter((r) => r.esfera == TransferenciaTipoEsfera.Federal).length,
                count_all: uniqueTransferencias.filter((r) => r.partido_id.includes(partido.id)).length,
                valor: uniqueTransferencias
                    .filter((r) => r.partido_id.includes(partido.id))
                    .reduce((sum, current) => sum + +current.valor_total, 0),

                etapas: etapasSoma.sort((a, b) => b.sum - a.sum),
                valor_etapas: etapasSoma.reduce((acc, curr) => acc + curr.sum, 0),
            };
        });

        // Adicionando item de "partido indefinido" para transferências sem partido
        dadosPorPartido.push({
            sigla: 'Partido Indefinido',
            count_estadual: uniqueTransferencias
                .filter((r) => r.partido_id.length == 0)
                .filter((r) => r.esfera == TransferenciaTipoEsfera.Estadual).length,
            count_federal: uniqueTransferencias
                .filter((r) => r.partido_id.length == 0)
                .filter((r) => r.esfera == TransferenciaTipoEsfera.Federal).length,
            count_all: uniqueTransferencias.filter((r) => r.partido_id.length == 0).length,
            valor: uniqueTransferencias
                .filter((r) => r.partido_id.length == 0)
                .reduce((sum, current) => sum + +current.valor_total, 0),
            etapas: [],
            valor_etapas: 0,
        });
        const dadosPorPartidoAgrupado = (() => {
            // Agrupa as transferências por sigla de partido, chave é o partido "sigla"
            const transferenciasAgrupadas = new Map<
                string,
                {
                    sigla: string;
                    transferencias_estadual: number;
                    transferencias_federal: number;
                    transferencias_total: number;
                    valor_total: number;
                }
            >();

            uniqueTransferencias.forEach((transferencia) => {
                // Cria uma lista de siglas de partidos para a transferência atual
                const partidoSiglas = transferencia.partido_id
                    .map((partidoId) => partidosRows.find((p) => p.id === partidoId)?.sigla)
                    .filter((sigla) => sigla !== undefined)
                    .sort();

                // Gera uma chave única para o grupo de partidos
                const chavePartidos = partidoSiglas.length > 0 ? partidoSiglas.join('/') : 'Partido Indefinido';

                if (!transferenciasAgrupadas.has(chavePartidos)) {
                    transferenciasAgrupadas.set(chavePartidos, {
                        sigla: chavePartidos,
                        transferencias_estadual: 0,
                        transferencias_federal: 0,
                        transferencias_total: 0,
                        valor_total: 0,
                    });
                }

                const grupo = transferenciasAgrupadas.get(chavePartidos)!;

                // por esfera
                if (transferencia.esfera === TransferenciaTipoEsfera.Estadual) {
                    grupo.transferencias_estadual++;
                } else if (transferencia.esfera === TransferenciaTipoEsfera.Federal) {
                    grupo.transferencias_federal++;
                }

                grupo.transferencias_total++;
                grupo.valor_total += Number(transferencia.valor_total);
            });

            return Array.from(transferenciasAgrupadas.values());
        })();

        const chartNroPorPartido: DashTransferenciaBasicChartDto = {
            title: {
                id: 'chart__NroPartido',
                text: 'Quantidade de transferências por partido',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            legend: {
                data: ['Estadual', 'Federal'],
                top: 'middle',
                left: 0,
                orient: 'vertical',
                textStyle: {
                    overflow: 'break',
                    width: 100,
                },
            },
            yAxis: {
                name: 'Número de transferências',
                nameLocation: 'end',
                type: 'value',
            },
            xAxis: {
                type: 'category',
                data: dadosPorPartidoAgrupado
                    .filter((e) => e.transferencias_total > 0)
                    .sort((a, b) => b.transferencias_total - a.transferencias_total)
                    .map((e) => e.sigla),
            },
            grid: { left: '30%' },
            series: [
                {
                    name: 'Estadual',
                    type: 'bar',
                    stack: 'total',
                    label: { show: true },
                    data: dadosPorPartidoAgrupado
                        .filter((e) => e.transferencias_total > 0)
                        .sort((a, b) => b.transferencias_total - a.transferencias_total)
                        .map((e) => e.transferencias_estadual.toString()),
                    color: '#372EA2',
                    barWidth: '20%',
                },
                {
                    name: 'Federal',
                    type: 'bar',
                    stack: 'total',
                    label: { show: true },
                    data: dadosPorPartidoAgrupado
                        .filter((e) => e.transferencias_total > 0)
                        .sort((a, b) => b.transferencias_total - a.transferencias_total)
                        .map((e) => e.transferencias_federal.toString()),
                    color: '#C6C1FB',
                    barWidth: '20%',
                },
            ],
        };

        let etapas = await this.prisma.workflowEtapa.findMany({
            select: {
                id: true,
                etapa_fluxo: true,
            },
        });

        // Filtrando arr de etapas para conter apenas etapas com valor atrelado.
        etapas = etapas.filter((etapa) => {
            const existe = dadosPorPartido.find((d) => {
                return d.etapas.find((de) => de.workflow_etapa_atual_id == etapa.id);
            });

            if (existe) return etapa;
        });

        // Etapa "virtual" para indicar Workflow não iniciado
        etapas.push({
            id: -1,
            etapa_fluxo: 'Workflow não iniciado',
        });

        const coresLegenda = ['#4F8562', '#7CC3F8', '#3B8FD8', '#184E77', '#DEEF9F', '#B5E48C', '#76C893', '#4F8562'];

        const chartValPorPartido: DashTransferenciaBasicChartDto = {
            title: {
                id: 'chart__ValPartido',
                text: 'Valor por partido',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            xAxis: {
                type: 'category',
                data: dadosPorPartidoDistribuicao.sort((a, b) => b.total - a.total).map((e) => e.sigla),
            },
            legend: {
                data: fasesUnicas,
                orient: 'vertical',
                top: 'middle',
                left: 0,
                textStyle: {
                    overflow: 'break',
                    width: 100,
                },
            },
            top: 'middle',
            grid: { left: '30%' },
            yAxis: {
                name: 'R$ MIL',
                nameLocation: 'end',
                type: 'value',
            },
            series: fasesUnicas.map((fase, itt) => {
                return {
                    name: fase,
                    type: 'bar',
                    stack: 'total',
                    barWidth: '20%',
                    color: coresLegenda[itt] ?? '#4F8562',
                    data: dadosPorPartidoDistribuicao
                        .sort((a, b) => b.total - a.total)
                        .map((partidoDados) => {
                            const valorParaFase = partidoDados.fases.get(fase) || 0;
                            return (valorParaFase / 1000).toFixed().toString();
                        }),
                };
            }),
        };

        const orgaoIds = rows.filter((e) => e.distribuicao_orgao_id != null).map((e) => e.distribuicao_orgao_id!);
        const orgaoSiglas = orgaoIds.length
            ? await this.prisma.orgao.findMany({
                  where: { id: { in: orgaoIds } },
                  select: { id: true, sigla: true },
              })
            : null;

        const dadosPorOrgao = orgaoSiglas
            ? orgaoSiglas.map((o) => {
                  const etapasSoma = rows
                      .filter((r) => r.distribuicao_orgao_id == o.id)
                      .reduce(
                          (acc, curr) => {
                              const etapaId = curr.workflow_etapa_atual_id ?? -1;
                              const valor = Number(curr.distribuicao_valor_total);

                              const existingObjIndex = acc.findIndex((obj) => obj.workflow_etapa_atual_id === etapaId);

                              if (existingObjIndex !== -1) {
                                  acc[existingObjIndex].sum += valor;
                              } else {
                                  acc.push({ workflow_etapa_atual_id: etapaId, sum: valor });
                              }
                              return acc;
                          },
                          [] as { workflow_etapa_atual_id: number; sum: number }[]
                      );
                  return {
                      sigla: o.sigla,
                      valor: etapasSoma,
                  };
              })
            : [];

        const chartValPorOrgao: DashTransferenciaBasicChartDto = {
            title: {
                id: 'chart__ValOrgao',
                text: 'Valor por órgão',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            top: 'middle',
            grid: { left: '30%' },
            xAxis: {
                type: 'category',
                data: dadosPorOrgao
                    .sort((a, b) => {
                        const sumA = a.valor.reduce((acc, curr) => acc + curr.sum, 0);
                        const sumB = b.valor.reduce((acc, curr) => acc + curr.sum, 0);
                        return sumB - sumA;
                    })
                    .map((o) => o.sigla),
            },
            yAxis: {
                name: 'R$ MIL',
                nameLocation: 'end',
                type: 'value',
            },
            legend: {
                data: etapas.map((e) => e.etapa_fluxo),
                left: 0,
                top: 'middle',
                orient: 'vertical',
                textStyle: {
                    overflow: 'break',
                    width: 100,
                },
            },
            series: etapas.map((etapa, itt) => {
                return {
                    name: etapa.etapa_fluxo,
                    type: 'bar',
                    stack: 'total',
                    barWidth: '20%',
                    color: coresLegenda[itt],
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: function (params: any) {
                            return params.value > 0 ? params.value : '';
                        },
                        fontSize: 12,
                        color: '#fff',
                        fontWeight: 'bold',
                    },
                    data: dadosPorOrgao
                        .sort((a, b) => {
                            const sumA = a.valor.reduce((acc, curr) => acc + curr.sum, 0);
                            const sumB = b.valor.reduce((acc, curr) => acc + curr.sum, 0);
                            return sumB - sumA;
                        })
                        .map((orgaoDados) => {
                            const valorParaEtapa = orgaoDados.valor.find(
                                (agregado) => agregado.workflow_etapa_atual_id == etapa.id
                            );
                            return valorParaEtapa ? (valorParaEtapa.sum / 1000).toFixed().toString() : '0';
                        }),
                };
            }),
        };

        const transferenciaIds = rows.map((r) => Number(r.transferencia_id));
        const valor_por_parlamentar: {
            parlamentar_id: number;
            nome_popular: string;
            parlamentar_foto_id: number | null;
            count: number;
            valor: Decimal;
        }[] = await this.prisma.$queryRaw`
            WITH parlamentar_totals AS (
                SELECT
                    tp.parlamentar_id,
                    p.nome_popular,
                    p.foto_upload_id AS parlamentar_foto_id,
                    COUNT(DISTINCT tp.transferencia_id) AS count,
                    SUM(tp.valor) AS valor
                FROM transferencia_parlamentar tp
                JOIN parlamentar p
                    ON tp.parlamentar_id = p.id
                    AND p.removido_em IS NULL
                WHERE tp.transferencia_id = ANY (${transferenciaIds})
                 AND tp.removido_em IS NULL AND tp.valor IS NOT NULL
                GROUP BY
                    tp.parlamentar_id,
                    p.nome_popular,
                    p.foto_upload_id
            ), ranked_parlamentares AS (
                SELECT
                    parlamentar_id,
                    nome_popular,
                    parlamentar_foto_id,
                    count,
                    valor,
                    DENSE_RANK() OVER (ORDER BY valor DESC) AS rank
                FROM parlamentar_totals
            )
            SELECT
                parlamentar_id,
                nome_popular,
                parlamentar_foto_id,
                count,
                valor
            FROM ranked_parlamentares
            WHERE rank <= 3
            ORDER BY valor DESC, parlamentar_id ASC`;

        return {
            valor_total: valorTotal,
            numero_por_esfera: chartPorEsfera,
            numero_por_status: chartPorStatus,
            numero_por_partido: chartNroPorPartido,
            valor_por_partido: chartValPorPartido,
            valor_por_orgao: chartValPorOrgao,
            valor_por_parlamentar: valor_por_parlamentar.map((e) => {
                return {
                    parlamentar: {
                        id: e.parlamentar_id,
                        nome_popular: e.nome_popular,
                        foto: e.parlamentar_foto_id
                            ? this.uploadService.getDownloadToken(e.parlamentar_foto_id, '1 days').download_token
                            : null,
                    },

                    valor: e.valor.toNumber(),
                };
            }),
        };
    }

    async getTransferenciasPainelEstrategico(
        filter: FilterDashTransferenciasPainelEstrategicoDto,
        user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<DashTransferenciasPainelEstrategicoDto>> {
        let retToken = filter.token_paginacao;
        const filterToken = filter.token_paginacao;
        let ipp = filter.ipp ?? 25;
        const page = filter.pagina ?? 1;
        let total_registros = 0;
        let tem_mais = false;

        if (page > 1 && !filter.token_paginacao) throw new HttpException('Campo obrigatório para paginação', 400);

        delete filter.pagina;
        delete filter.token_paginacao;
        let now = new Date(Date.now());

        if (filterToken) {
            const decoded = this.decodeNextPageTokenComPaginas(filterToken, filter);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }
        const offset = (page - 1) * ipp;

        const rows = await this.prisma.viewTransferenciaAnalise.findMany({
            where: {
                parlamentar_id: filter.parlamentar_ids ? { hasSome: filter.parlamentar_ids } : undefined,
                ano: filter.anos ? { in: filter.anos } : undefined,
                partido_id: filter.partido_ids ? { hasSome: filter.partido_ids } : undefined,
                workflow_etapa_atual_id: filter.etapa_ids ? { in: filter.etapa_ids } : undefined,
            },
            distinct: ['transferencia_id'],
            select: {
                transferencia_id: true,
                esfera: true,
                valor_total: true,
                workflow_etapa_atual_id: true,
                workflow_fase_atual_id: true,
                parlamentar_id: true,
                transferencia: {
                    select: {
                        identificador: true,
                        objeto: true,
                        esfera: true,
                        tipo: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },
                        orgao_concedente: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },
                        parlamentar: {
                            select: {
                                parlamentar: {
                                    select: {
                                        id: true,
                                        nome_popular: true,
                                        nome: true,
                                    },
                                },
                                partido: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        nome: true,
                                        numero: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: [{ valor_total: 'desc' }],
            skip: offset,
            take: ipp + 1,
        });

        const linhas = rows.map((r) => {
            return {
                id: r.transferencia_id,
                esfera: r.esfera,
                repasse: r.valor_total.toNumber(),
                etapa_id: r.workflow_etapa_atual_id,
                identificador: r.transferencia.identificador,
                // Objeto pode ser uma string grande, portanto iremos retornar apenas os 100 primeiros caracteres
                objeto:
                    r.transferencia.objeto.length > 100
                        ? r.transferencia.objeto.substring(0, 100) + '...'
                        : r.transferencia.objeto,
                orgao_gestor: {
                    id: r.transferencia.orgao_concedente.id,
                    sigla: r.transferencia.orgao_concedente.sigla,
                    descricao: r.transferencia.orgao_concedente.descricao,
                },
                parlamentar: r.transferencia.parlamentar.map((p) => {
                    return {
                        id: p.parlamentar.id,
                        nome_popular: p.parlamentar.nome_popular,
                        nome: p.parlamentar.nome,
                    };
                }),
                partido: r.transferencia.parlamentar
                    .filter((e) => e.partido)
                    .map((p) => {
                        return {
                            id: p.partido!.id,
                            sigla: p.partido!.sigla,
                            nome: p.partido!.nome,
                            numero: p.partido!.numero,
                        };
                    }),
                tipo: {
                    id: r.transferencia.tipo.id,
                    nome: r.transferencia.tipo.nome,
                },
            } satisfies DashTransferenciasPainelEstrategicoDto;
        });

        if (filterToken) {
            retToken = filterToken;
        } else {
            const info = await this.encodeNextPageTokenListaTransferencias(now, filter, filter.ipp);
            retToken = info.jwt;
            total_registros = info.body.total_rows;
        }
        tem_mais = offset + linhas.length < total_registros;
        const paginas = total_registros > ipp ? Math.ceil(total_registros / ipp) : 1;

        return {
            tem_mais: tem_mais,
            total_registros: total_registros,
            token_paginacao: retToken,
            paginas: paginas,
            pagina_corrente: page,
            linhas: linhas,
            token_ttl: PAGINATION_TOKEN_TTL,
        };
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    private decodeNextPageTokenComPaginas(
        jwt: string | undefined,
        filters: FilterDashTransferenciasPainelEstrategicoDto
    ): AnyPageTokenJwtBody {
        let tmp: AnyPageTokenJwtBody | null = null;

        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as AnyPageTokenJwtBody;
        } catch {
            throw new HttpException('token_paginacao invalido', 400);
        }
        if (!tmp) throw new HttpException('token_paginacao invalido ou faltando', 400);
        if (tmp.search_hash != Object2Hash(filters))
            throw new HttpException(
                'Parâmetros da busca não podem ser diferente da busca inicial para avançar na paginação.',
                400
            );
        return tmp;
    }

    private async encodeNextPageTokenListaTransferencias(
        issued_at: Date,
        filter: FilterDashTransferenciasPainelEstrategicoDto,
        ipp?: number
    ): Promise<{
        jwt: string;
        body: AnyPageTokenJwtBody;
    }> {
        const rows = await this.prisma.viewTransferenciaAnalise.findMany({
            distinct: ['transferencia_id'],
            where: {
                parlamentar_id: filter.parlamentar_ids ? { hasSome: filter.parlamentar_ids } : undefined,
                ano: filter.anos ? { in: filter.anos } : undefined,
                partido_id: filter.partido_ids ? { hasSome: filter.partido_ids } : undefined,
                workflow_etapa_atual_id: filter.etapa_ids ? { in: filter.etapa_ids } : undefined,
            },
        });
        const nroRows = rows.length;

        const body = {
            search_hash: Object2Hash(filter),
            ipp: ipp!,
            issued_at: issued_at.valueOf(),
            total_rows: nroRows,
        } satisfies AnyPageTokenJwtBody;
        return {
            jwt: this.jwtService.sign(body),
            body,
        };
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }

    async transferenciasWorkflow(
        filter: FilterDashTransferenciasWorkflowDto,
        user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<MfDashTransferenciasDto>> {
        const searchConditions = await this.transferenciaService.buildSearchConditions(filter.palavra_chave);

        const ipp = filter.ipp ?? 25;
        const page = filter.pagina ?? 1;
        let offset = 0;
        let total_registros = 0;

        if (page > 1 && !filter.token_paginacao) throw new HttpException('Campo obrigatório para paginação', 400);

        if (filter.token_paginacao) {
            const decoded = this.decodeNextPageTokenWorkflow(filter.token_paginacao, filter);
            total_registros = decoded.total_rows;
            offset = (page - 1) * ipp;
        } else {
            offset = (page - 1) * ipp;
        }

        // Build andamento filter conditions (combined so atividade+orgaos match the same row)
        const andamentoFilter: Prisma.TransferenciaAndamentoWhereInput = {
            data_termino: null,
            removido_em: null,
            ...(filter.atividade ? { workflow_fase: { fase: { in: filter.atividade } } } : {}),
            ...(filter.orgaos_ids ? { orgao_responsavel_id: { in: filter.orgaos_ids } } : {}),
        };

        const where: Prisma.TransferenciaWhereInput = {
            removido_em: null,
            workflow_id: { not: null },
            AND: this.transferenciaService.permissionSet(user),
            esfera: filter.esfera ? { in: filter.esfera } : undefined,
            ...(searchConditions ? { OR: searchConditions } : {}),
            parlamentar: filter.partido_ids ? { some: { partido_id: { in: filter.partido_ids } } } : undefined,
            ...(filter.atividade || filter.orgaos_ids ? { andamentoWorkflow: { some: andamentoFilter } } : {}),
        };

        const [countResult, rows] = await this.prisma.$transaction([
            this.prisma.transferencia.count({ where }),
            this.prisma.transferencia.findMany({
                where,
                select: {
                    id: true,
                    identificador: true,
                    emenda: true,
                    esfera: true,
                    objeto: true,
                    workflow_id: true,
                    parlamentar: {
                        select: { partido_id: true },
                    },
                    andamentoWorkflow: {
                        where: {
                            data_termino: null,
                            removido_em: null,
                        },
                        select: {
                            id: true,
                            data_inicio: true,
                            workflow_fase_id: true,
                            workflow_etapa_id: true,
                            orgao_responsavel_id: true,
                            workflow_fase: {
                                select: { fase: true },
                            },
                        },
                        take: 1,
                    },
                },
                orderBy: [{ identificador: 'asc' }],
                skip: offset,
                take: ipp + 1,
            }),
        ]);

        if (!filter.token_paginacao) {
            total_registros = countResult;
        }

        let tem_mais = false;
        let token_paginacao: string | null = null;
        const linhasRaw = [...rows];

        if (linhasRaw.length > ipp) {
            tem_mais = true;
            linhasRaw.pop();
        }

        // Batch fetch FluxoFase.duracao for all active andamento entries
        const andamentoEntries = linhasRaw
            .flatMap((r) => r.andamentoWorkflow)
            .filter((a) => a !== undefined && a !== null);

        const faseIds = [...new Set(andamentoEntries.map((a) => a.workflow_fase_id))];
        const workflowIds = [...new Set(linhasRaw.map((r) => r.workflow_id).filter((id): id is number => id !== null))];

        let fluxoFaseDuracaoMap = new Map<string, number | null>();

        if (faseIds.length > 0 && workflowIds.length > 0) {
            const fluxoFases = await this.prisma.fluxoFase.findMany({
                where: {
                    fase_id: { in: faseIds },
                    fluxo: {
                        workflow_id: { in: workflowIds },
                    },
                    removido_em: null,
                },
                select: {
                    fase_id: true,
                    duracao: true,
                    fluxo: {
                        select: { workflow_id: true },
                    },
                },
            });

            for (const ff of fluxoFases) {
                const key = `${ff.fluxo.workflow_id}-${ff.fase_id}`;
                // If multiple fluxo_fase entries exist for same (workflow_id, fase_id),
                // use the one with duracao defined (prefer non-null)
                if (!fluxoFaseDuracaoMap.has(key) || (ff.duracao !== null && fluxoFaseDuracaoMap.get(key) === null)) {
                    fluxoFaseDuracaoMap.set(key, ff.duracao);
                }
            }
        }

        // Map results to MfDashTransferenciasDto
        let linhas: MfDashTransferenciasDto[] = linhasRaw.map((r) => {
            const andamento = r.andamentoWorkflow[0] ?? null;

            let atividade: string;
            let data: string | null = null;
            let orgaos: number[] = [];

            if (!andamento) {
                atividade = 'Aguardando liberação da próxima de fase';
            } else {
                atividade = andamento.workflow_fase.fase;
                orgaos = andamento.orgao_responsavel_id ? [andamento.orgao_responsavel_id] : [];

                // Calculate deadline from data_inicio + duracao
                if (andamento.data_inicio && r.workflow_id) {
                    const key = `${r.workflow_id}-${andamento.workflow_fase_id}`;
                    const duracao = fluxoFaseDuracaoMap.get(key) ?? null;

                    if (duracao !== null) {
                        const deadline = new Date(andamento.data_inicio);
                        deadline.setDate(deadline.getDate() + duracao);
                        data = Date2YMD.toStringOrNull(deadline);
                    }
                }
            }

            return {
                transferencia_id: r.id,
                emenda: r.emenda,
                identificador: r.identificador,
                atividade,
                data,
                data_origem: 'Workflow',
                orgaos,
                esfera: r.esfera,
                objeto: r.objeto,
                partido_ids: r.parlamentar.length ? r.parlamentar.map((p) => p.partido_id!) : null,
            };
        });

        // App-level prazo filter on the calculated deadline
        if (filter.prazo !== undefined) {
            const prazoLimit = new Date(Date.now() + filter.prazo * 24 * 60 * 60 * 1000);
            const prazoLimitStr = Date2YMD.toStringOrNull(prazoLimit);

            linhas = linhas.filter((l) => {
                // If no deadline calculated, keep it (not considered delayed)
                if (l.data === null) return true;
                return l.data <= prazoLimitStr!;
            });
        }

        // Generate pagination token
        if (!filter.token_paginacao) {
            const body: AnyPageTokenJwtBody = {
                search_hash: Object2Hash({
                    esfera: filter.esfera,
                    partido_ids: filter.partido_ids,
                    atividade: filter.atividade,
                    orgaos_ids: filter.orgaos_ids,
                    palavra_chave: filter.palavra_chave,
                    prazo: filter.prazo,
                }),
                ipp,
                issued_at: Date.now(),
                total_rows: total_registros,
            };
            token_paginacao = this.jwtService.sign(body);
        } else {
            token_paginacao = filter.token_paginacao;
        }

        const paginas = Math.ceil(total_registros / ipp);
        const pagina_corrente = page;

        return {
            linhas,
            paginas,
            pagina_corrente,
            total_registros,
            tem_mais,
            token_paginacao,
            token_ttl: PAGINATION_TOKEN_TTL,
        };
    }

    private decodeNextPageTokenWorkflow(
        jwt: string | undefined,
        filter: FilterDashTransferenciasWorkflowDto
    ): AnyPageTokenJwtBody {
        let tmp: AnyPageTokenJwtBody | null = null;

        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as AnyPageTokenJwtBody;
        } catch {
            throw new HttpException('token_paginacao invalido', 400);
        }
        if (!tmp) throw new HttpException('token_paginacao invalido ou faltando', 400);

        const filterHash = Object2Hash({
            esfera: filter.esfera,
            partido_ids: filter.partido_ids,
            atividade: filter.atividade,
            orgaos_ids: filter.orgaos_ids,
            palavra_chave: filter.palavra_chave,
            prazo: filter.prazo,
        });
        if (tmp.search_hash != filterHash)
            throw new HttpException(
                'Parâmetros da busca não podem ser diferente da busca inicial para avançar na paginação.',
                400
            );
        return tmp;
    }
}
