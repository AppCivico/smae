import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { NotaService } from '../../bloco-nota/nota/nota.service';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferenciaService } from '../transferencia/transferencia.service';
import { FilterDashNotasDto, MfDashNotasDto } from './dto/notas.dto';
import {
    DashAnaliseTranferenciasChartsDto,
    DashTransferenciaBasicChartDto,
    FilterDashTransferenciasAnaliseDto,
    FilterDashTransferenciasDto,
    ListMfDashTransferenciasDto,
    MfDashTransferenciasDto,
} from './dto/transferencia.dto';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { UploadService } from 'src/upload/upload.service';

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
        const ids = await this.transferenciaService.buscaIdsPalavraChave(filter.palavra_chave);

        // eh marco, ter data de termino (ter data planejado), não ter data de termino real
        //
        const rows = await this.prisma.transferenciaStatusConsolidado.findMany({
            where: {
                transferencia_id: ids ? { in: ids } : undefined,
                orgaos_envolvidos: filter.orgaos_ids ? { hasSome: filter.orgaos_ids } : undefined,
                situacao: filter.atividade ? { in: filter.atividade } : undefined,
                transferencia: {
                    AND: this.transferenciaService.permissionSet(user),
                    partido_id: filter.partido_ids ? { in: filter.partido_ids } : undefined,
                    esfera: filter.esfera ? { in: filter.esfera } : undefined,
                },
            },
            include: {
                transferencia: {
                    select: {
                        id: true,
                        identificador: true,
                        esfera: true,
                        objeto: true,
                        partido_id: true,
                    },
                },
            },
            orderBy: [{ data: { sort: 'asc', nulls: 'first' } }, { transferencia: { identificador: 'asc' } }],
        });

        const ret: ListMfDashTransferenciasDto = {
            linhas: rows.map((r): MfDashTransferenciasDto => {
                return {
                    data: r.data,
                    data_origem: r.data_origem,
                    atividade: r.situacao,
                    identificador: r.transferencia.identificador,
                    transferencia_id: r.transferencia.id,
                    esfera: r.transferencia.esfera,
                    orgaos: r.orgaos_envolvidos,
                    objeto: r.transferencia.objeto,
                    partido_id: r.transferencia.partido_id,
                };
            }),
        };

        return ret;
    }

    async notas(filters: FilterDashNotasDto, user: PessoaFromJwt): Promise<PaginatedDto<MfDashNotasDto>> {
        const transferenciasIds = await this.transferenciaService.buscaIdsPalavraChave(filters.palavra_chave);

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
                    id: transferenciasIds ? { in: transferenciasIds } : undefined,
                    partido_id: filters.partido_ids ? { in: filters.partido_ids } : undefined,
                    esfera: filters.esfera ? { in: filters.esfera } : undefined,

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
                parlamentar_id: filter.parlamentar_ids ? { in: filter.parlamentar_ids } : undefined,
                ano: filter.anos ? { in: filter.anos } : undefined,
                partido_id: filter.partido_ids ? { in: filter.partido_ids } : undefined,
                workflow_etapa_atual_id: filter.etapa_ids ? { in: filter.etapa_ids } : undefined,
            },
        });

        const partidosRows = await this.prisma.partido.findMany({
            where: {
                removido_em: null,
                id: { in: rows.filter((r) => r.partido_id != null).map((r) => r.partido_id!) },
            },
            select: {
                id: true,
                sigla: true,
            },
        });

        const valorTotal: number = rows.reduce((sum, current) => sum + +current.valor_total, 0);

        const countAll: number = rows.length;
        const chartPorEsfera: DashTransferenciaBasicChartDto = {
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
                    data: [
                        (
                            (100 * rows.filter((e) => e.esfera == TransferenciaTipoEsfera.Federal).length) /
                            countAll
                        ).toFixed(2),
                        (
                            (100 * rows.filter((e) => e.esfera == TransferenciaTipoEsfera.Estadual).length) /
                            countAll
                        ).toFixed(2),
                    ],
                },
            ],
        };

        const chartPorStatus: DashTransferenciaBasicChartDto = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            xAxis: { type: 'value' },
            yAxis: {
                type: 'category',
                data: ['Prejudicadas', 'Concluídas', 'Em Andamento', 'Disponibilizadas'],
            },
            series: [
                {
                    type: 'bar',
                    data: [
                        rows.filter((e) => e.prejudicada == true).length.toString(),
                        rows.filter((e) => e.workflow_finalizado == true).length.toString(),
                        rows
                            .filter((e) => e.workflow_etapa_atual_id != null && e.workflow_finalizado == false)
                            .length.toString(),
                        countAll.toString(),
                    ],
                },
            ],
        };

        const dadosPorPartido = partidosRows.map((partido) => {
            return {
                sigla: partido.sigla,
                count_estadual: rows
                    .filter((r) => r.partido_id == partido.id)
                    .filter((r) => r.esfera == TransferenciaTipoEsfera.Estadual).length,
                count_federal: rows
                    .filter((r) => r.partido_id == partido.id)
                    .filter((r) => r.esfera == TransferenciaTipoEsfera.Federal).length,

                valor: rows
                    .filter((r) => r.partido_id == partido.id)
                    .reduce((sum, current) => sum + +current.valor_total, 0),
            };
        });
        const chartNroPorPartido: DashTransferenciaBasicChartDto = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            xAxis: { type: 'value' },
            yAxis: {
                type: 'category',
                data: dadosPorPartido.map((e) => e.sigla),
            },
            series: [
                {
                    name: 'Estadual',
                    type: 'bar',
                    stack: 'total',
                    label: { show: true },
                    data: dadosPorPartido.map((e) => e.count_estadual.toString()),
                },
                {
                    name: 'Federal',
                    type: 'bar',
                    stack: 'total',
                    label: { show: true },
                    data: dadosPorPartido.map((e) => e.count_federal.toString()),
                },
            ],
        };

        const chartValPorPartido: DashTransferenciaBasicChartDto = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            xAxis: {
                type: 'category',
                data: dadosPorPartido.map((e) => e.sigla),
            },
            yAxis: { type: 'value' },
            series: [
                {
                    type: 'bar',
                    label: { show: true },
                    data: dadosPorPartido.map((e) => e.valor.toString()),
                },
            ],
        };

        const orgaoIds = rows.filter((e) => e.distribuicao_orgao_id != null).map((e) => e.distribuicao_orgao_id!);
        const orgaoSiglas = orgaoIds.length
            ? await this.prisma.orgao.findMany({
                  where: { id: { in: orgaoIds } },
                  select: { id: true, descricao: true },
              })
            : null;

        const dadosPorOrgao = orgaoSiglas
            ? orgaoSiglas.map((o) => {
                  return {
                      sigla: o.descricao,
                      valor: rows
                          .filter((r) => r.distribuicao_orgao_id == o.id)
                          .reduce((sum, current) => sum + +current.valor_total, 0),
                  };
              })
            : [];

        const chartValPorOrgao: DashTransferenciaBasicChartDto = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            xAxis: {
                type: 'category',
                data: dadosPorOrgao.map((o) => o.sigla),
            },
            yAxis: { type: 'value' },
            series: [
                {
                    type: 'bar',
                    label: { show: true },
                    data: dadosPorOrgao.map((o) => o.valor.toString()),
                },
            ],
        };

        const valor_por_parlamentar = await this.prisma.viewRankingTransferenciaParlamentar.findMany({
            take: 3,
        });

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

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }
}
