import { HttpException, Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelTribunalDeContasDto } from './dto/create-tribunal-de-contas.dto';
import { RelatorioTribunalDeContasDto, RelTribunalDeContasDto } from './entities/tribunal-de-contas.entity';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class TribunalDeContasService implements ReportableService {
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
                dotacao: true,
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

            return {
                ano: distribuicao.transferencia.ano,
                emenda: distribuicao.transferencia.emenda,
                programa: distribuicao.transferencia.programa,
                parlamentar: distribuicao.parlamentares.map((p) => p.parlamentar.nome_popular).join('|'),
                status: statusReport ?? null,
                valor_repasse: distribuicao.valor?.toString() ?? null,
                acao: distribuicao.objeto,
                gestor_municipal: distribuicao.orgao_gestor.sigla + ' - ' + distribuicao.orgao_gestor.descricao,
                prazo_vigencia: Date2YMD.toStringOrNull(distribuicao.vigencia),
                dotacao_orcamentaria: `="${distribuicao.dotacao}"`,
                rubrica_de_receita: distribuicao.rubrica_de_receita ?? '',
                finalidade: distribuicao.finalidade ?? '',
                valor_empenho: distribuicao.valor_empenho?.toNumber() ?? null,
                liquidacao_pagamento: distribuicao.valor_liquidado?.toNumber() ?? null,
            };
        });

        return {
            linhas: out,
        };
    }

    async toFileOutput(params: any): Promise<FileOutput[]> {
        const dados = await this.asJSON(params);

        const out: FileOutput[] = [];

        if (dados.linhas?.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    {
                        value: (row: any) => (row.emenda ? `="${String(row.emenda).replace(/\D/g, '')}"` : ''),
                        label: 'Emenda',
                    },
                    {
                        value: (row: any) => (row.programa ? `="${String(row.programa).replace(/\D/g, '')}"` : ''),
                        label: 'Programa',
                    },
                    { value: 'ano', label: 'Ano' },
                    { value: 'parlamentar', label: 'Parlamentar' },
                    {
                        value: (row: any) =>
                            row.valor_repasse != null
                                ? new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                  }).format(Number(row.valor_repasse))
                                : '',
                        label: 'Valor de Repasse',
                    },
                    { value: 'acao', label: 'Ação' },
                    { value: 'gestor_municipal', label: 'Gestor Municipal' },
                    { value: 'prazo_vigencia', label: 'Prazo de Vigência' },
                    { value: 'dotacao_orcamentaria', label: 'Dotação Orçamentaria' },
                    { value: 'rubrica_de_receita', label: 'Rubrica de Receita' },
                    { value: 'finalidade', label: 'Política pública' },
                    {
                        value: (row: any) =>
                            row.valor_empenho != null
                                ? new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                  }).format(Number(row.valor_empenho))
                                : '',
                        label: 'Empenho',
                    },
                    {
                        value: (row: any) =>
                            row.liquidacao_pagamento != null
                                ? new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                  }).format(Number(row.liquidacao_pagamento))
                                : '',
                        label: 'Liquidação/Pagamento',
                    },
                ],
            });
            const linhas = json2csvParser.parse(
                dados.linhas.map((r) => {
                    return { ...r };
                })
            );
            out.push({
                name: 'tribunal-de-contas.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: params,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                    }),
                    'utf8'
                ),
            },
            ...out,
        ];
    }
}
