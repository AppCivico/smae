import { HttpException, Injectable } from '@nestjs/common';
import { CampoVinculo } from '@prisma/client';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { getReportRowSchema } from '../post-process/report-column.decorator';
import { ReportFileSchema, SchemaAwareReportableService } from '../post-process/report-schema';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import {
    DefaultCsvOptions,
    DefaultTransforms,
    FileOutput,
    Path2FileName,
    ReportableService,
} from '../utils/utils.service';
import { CreateRelTribunalDeContasDto } from './dto/create-tribunal-de-contas.dto';
import { RelTribunalDeContasCsvRow } from './entities/tribunal-de-contas-csv.entity';
import { RelatorioTribunalDeContasDto, RelTribunalDeContasDto } from './entities/tribunal-de-contas.entity';
@Injectable()
export class TribunalDeContasService implements ReportableService, SchemaAwareReportableService {
    constructor(private readonly prisma: PrismaService) {}

    async asJSON(dto: CreateRelTribunalDeContasDto): Promise<RelatorioTribunalDeContasDto> {
        // params de ano são tratados como range.
        // logo se um for enviado.
        // Exigir ambos
        if ((dto.ano_inicio && !dto.ano_fim) || (!dto.ano_inicio && dto.ano_fim)) {
            throw new HttpException('Para filtrar por ano, é necessário enviar ambos os anos.', 400);
        }

        const distribuicoes = await this.prisma.distribuicaoRecurso.findMany({
            where: {
                removido_em: null,
                transferencia: {
                    esfera: dto.esfera,
                    tipo_id: dto.tipo_id,
                    ano: dto.ano_inicio ? { gte: dto.ano_inicio, lte: dto.ano_fim } : undefined,
                },
            },
            select: {
                valor: true,
                objeto: true,
                vigencia: true,
                dotacoes: {
                    where: { removido_em: null },
                    select: { dotacao: true },
                },
                rubrica_de_receita: true,
                finalidade: true,
                valor_empenho: true,
                valor_liquidado: true,
                transferencia: {
                    select: {
                        emenda: true,
                        ano: true,
                        programa: true,
                    },
                },
                parlamentares: {
                    where: {
                        removido_em: null,
                        AND: [{ valor: { not: null } }, { valor: { gt: 0 } }],
                    },
                    select: {
                        parlamentar: {
                            select: {
                                nome_popular: true,
                            },
                        },
                    },
                },
                orgao_gestor: {
                    select: {
                        sigla: true,
                        descricao: true,
                    },
                },
                status: {
                    where: { removido_em: null },
                    orderBy: { data_troca: 'desc' },
                    take: 1,
                    select: {
                        status: true,
                        status_base: true,
                    },
                },
                vinculos: {
                    where: {
                        removido_em: null,
                        invalidado_em: null,
                        campo_vinculo: CampoVinculo.Dotacao,
                    },
                    select: {
                        valor_vinculo: true,
                    },
                },
            },
        });

        const out: RelTribunalDeContasDto[] = distribuicoes.map((distribuicao) => {
            const distribuicaoStatusRow = distribuicao.status[0] ? distribuicao.status[0] : null;
            let statusReport: string | undefined;
            if (distribuicaoStatusRow) {
                statusReport = distribuicaoStatusRow.status
                    ? distribuicaoStatusRow.status.nome
                    : distribuicaoStatusRow.status_base?.nome;
            }

            // Construindo str de dotação(es)
            // A str é formada por concatenação das dotações da distribuição e os vínculos de dotação.
            // (unique dotações)
            const dotacoes: string[] = distribuicao.dotacoes.map((d) => d.dotacao);
            distribuicao.vinculos.forEach((vinculo) => {
                if (vinculo.valor_vinculo && !dotacoes.includes(vinculo.valor_vinculo)) {
                    dotacoes.push(vinculo.valor_vinculo);
                }
            });
            const dotacaoStr = dotacoes.join(' | ');

            return {
                ano: distribuicao.transferencia.ano,
                // Apenas os dígitos: é limpeza de dado exigida pelo Tribunal (não formatação),
                // por isso continua na extração e não no pós-processamento.
                emenda: distribuicao.transferencia.emenda
                    ? String(distribuicao.transferencia.emenda).replace(/\D/g, '')
                    : null,
                programa: distribuicao.transferencia.programa
                    ? String(distribuicao.transferencia.programa).replace(/\D/g, '')
                    : null,
                parlamentar: distribuicao.parlamentares.map((p) => p.parlamentar.nome_popular).join('|'),
                status: statusReport ?? null,
                // Valores monetários saem como string para não perder precisão do Decimal do
                // Prisma: `toNumber()` passaria por double. O DuckDB relê a coluna já como
                // DECIMAL(18,2), então a conversão é exata.
                valor_repasse: distribuicao.valor?.toString() ?? null,
                acao: distribuicao.objeto,
                gestor_municipal: distribuicao.orgao_gestor.sigla + ' - ' + distribuicao.orgao_gestor.descricao,
                prazo_vigencia: Date2YMD.toStringOrNull(distribuicao.vigencia) ?? null,
                // Sem o hack `="..."`: o guard de texto do Excel é aplicado no pós-processamento.
                // Vazio virou `null` (antes era a string ' - ') para o DuckDB ler como NULL.
                dotacao_orcamentaria: dotacaoStr ? dotacaoStr : null,
                rubrica_de_receita: distribuicao.rubrica_de_receita ?? '',
                finalidade: distribuicao.finalidade ?? '',
                valor_empenho: distribuicao.valor_empenho?.toString() ?? null,
                liquidacao_pagamento: distribuicao.valor_liquidado?.toString() ?? null,
            };
        });

        return {
            linhas: out,
        };
    }

    async describeSchema(_params: any): Promise<ReportFileSchema[]> {
        return [getReportRowSchema(RelTribunalDeContasCsvRow)];
    }

    async toFileOutput(params: any, ctx: ReportContext): Promise<FileOutput[]> {
        const dados = await this.asJSON(params);

        const out: FileOutput[] = [];

        if (dados.linhas?.length) {
            const tmp = ctx.getTmpFile('tribunal-de-contas.csv');

            // CSV bruto: nomes de coluna "de máquina", sem rótulos e sem lambdas de
            // formatação. Rótulos, moeda, data pt-BR e o guard do Excel vêm do schema
            // declarado em RelTribunalDeContasCsvRow, aplicado no pós-processamento.
            const csvOpts: CsvWriterOptions<RelTribunalDeContasDto> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: [
                    'emenda',
                    'programa',
                    'ano',
                    'parlamentar',
                    'valor_repasse',
                    'acao',
                    'gestor_municipal',
                    'prazo_vigencia',
                    'dotacao_orcamentaria',
                    'rubrica_de_receita',
                    'finalidade',
                    'valor_empenho',
                    'liquidacao_pagamento',
                ],
            };

            await WriteCsvToFile(dados.linhas, tmp.stream, csvOpts);

            out.push({
                name: 'tribunal-de-contas.csv',
                localFile: tmp.path,
            });
        }

        await ctx.resumoSaida('Tribunal de Contas', dados.linhas.length);

        return out;
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
