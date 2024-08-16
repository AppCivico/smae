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
                transferencia: {
                    select: {
                        emenda: true,
                        ano: true,
                    },
                },
                parlamentares: {
                    where: { removido_em: null },
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
            },
        });

        const out: RelTribunalDeContasDto[] = distribuicoes.map((distribuicao) => {
            return {
                ano: distribuicao.transferencia.ano,
                parlamentar: distribuicao.parlamentares.map((p) => p.parlamentar.nome_popular).join('|'),
                valor_repasse: distribuicao.valor.toNumber(),
                emenda: distribuicao.transferencia.emenda,
                acao: distribuicao.objeto,
                gestor_municipal: distribuicao.orgao_gestor.sigla + ' - ' + distribuicao.orgao_gestor.descricao,
                prazo_vigencia: Date2YMD.toStringOrNull(distribuicao.vigencia),
                dotacao_orcamentaria: '',
                rubrica_de_receita: '',
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
            });
            const linhas = json2csvParser.parse(
                dados.linhas.map((r) => {
                    return { ...r };
                })
            );
            out.push({
                name: 'distribuicoes.csv',
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
