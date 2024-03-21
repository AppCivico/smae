import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelTransferenciasDto } from './dto/create-transferencias.dto';
import { RelTransferenciasDto, TransferenciasRelatorioDto } from './entities/transferencias.entity';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

type WhereCond = {
    whereString: string;
    queryParams: any[];
};

class RetornoDbTransferencias {
    id: number;
    identificador: string;
    ano: number | null;
    objeto: string;
    detalhamento: string | null;
    critico: boolean;
    clausula_suspensiva: boolean;
    clausula_suspensiva_vencimento: Date | null;
    normativa: string | null;
    observacoes: string | null;
    programa: string | null;
    empenho: boolean | null;
    pendente_preenchimento_valores: boolean;
    valor: number | null;
    valor_total: number | null;
    valor_contrapartida: number | null;
    emenda: string | null;
    dotacao: string | null;
    demanda: string | null;
    banco_fim: string | null;
    conta_fim: string | null;
    agencia_fim: string | null;
    banco_aceite: string | null;
    conta_aceite: string | null;
    nome_programa: string | null;
    agencia_aceite: string | null;
    emenda_unitaria: string | null;
    gestor_contrato: string | null;
    ordenador_despesa: string | null;
    numero_identificacao: string | null;
    secretaria_concedente: string | null;
    interface: string;
    esfera: string;
    cargo: string | null;

    partido_id: number | null;
    partido_sigla: string | null;

    parlamentar_id: number | null;
    parlamentar_nome: string | null;
    parlamentar_nome_popular: string | null;

    orgao_concedente_id: number;
    orgao_concedente_sigla: string;
    orgao_concedente_descricao: string;
}

@Injectable()
export class TransferenciasService implements ReportableService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateRelTransferenciasDto): Promise<TransferenciasRelatorioDto> {
        const whereCond = await this.buildFilteredWhereStr(dto);

        const out_transferencias: RelTransferenciasDto[] = [];

        const sql = `
            SELECT
                t.id,
                t.identificador,
                t.ano,
                t.objeto,
                t.detalhamento,
                t.critico,
                t.clausula_suspensiva,
                t.clausula_suspensiva_vencimento,
                t.normativa,
                t.observacoes,
                t.programa,
                t.empenho,
                t.pendente_preenchimento_valores,
                t.valor,
                t.valor_total,
                t.valor_contrapartida,
                t.emenda,
                t.dotacao,
                t.demanda,
                t.banco_fim,
                t.conta_fim,
                t.agencia_fim,
                t.banco_aceite,
                t.conta_aceite,
                t.nome_programa,
                t.agencia_aceite,
                t.emenda_unitaria,
                t.gestor_contrato,
                t.ordenador_despesa,
                t.numero_identificacao,
                t.secretaria_concedente,
                t.interface,
                t.esfera,
                t.cargo,
                pa.id AS partido_id,
                pa.sigla AS partido_sigla,
                pa.nome AS partido_nome,
                o1.id AS orgao_concedente_id,
                o1.sigla AS orgao_concedente_sigla,
                o1.descricao AS orgao_concedente_nome,
                p.id AS parlamentar_id,
                p.nome_popular AS parlamentar_nome_popular,
                p.nome AS parlamentar_nome
            FROM transferencia t
            JOIN transferencia_tipo tt ON tt.id = t.tipo_id
            LEFT JOIN parlamentar p ON p.id = t.parlamentar_id
            LEFT JOIN partido pa ON pa.id = t.partido_id
            JOIN orgao o1 ON o1.id = t.orgao_concedente_id
            ${whereCond.whereString}
            `;

        const data: RetornoDbTransferencias[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);
        this.convertRowsTransferenciasInto(data, out_transferencias);

        return {
            linhas: out_transferencias,
        };
    }

    private async buildFilteredWhereStr(filters: CreateRelTransferenciasDto): Promise<WhereCond> {
        const whereConditions: string[] = [];
        const queryParams: any[] = [];

        let paramIndex = 1;

        if (filters.esfera) {
            whereConditions.push(`t.vetores_busca @@ to_tsquery('portuguese', $${paramIndex} || ':*')`);
            queryParams.push(filters.esfera);
            paramIndex++;
        }

        if (filters.interface) {
            whereConditions.push(`t.vetores_busca @@ to_tsquery('portuguese', $${paramIndex} || ':*')`);
            queryParams.push(filters.interface);
            paramIndex++;
        }

        if (filters.ano) {
            whereConditions.push(`t.vetores_busca @@ to_tsquery('portuguese', $${paramIndex} || ':*')`);
            queryParams.push(filters.ano);
            paramIndex++;
        }

        if (filters.objeto) {
            whereConditions.push(`t.vetores_busca @@ to_tsquery('portuguese', $${paramIndex} || ':*')`);
            queryParams.push(filters.objeto);
            paramIndex++;
        }

        if (filters.gestor_contrato) {
            whereConditions.push(`t.vetores_busca @@ to_tsquery('portuguese', $${paramIndex} || ':*')`);
            queryParams.push(filters.gestor_contrato);
            paramIndex++;
        }

        if (filters.secretaria_concedente) {
            whereConditions.push(`t.vetores_busca @@ to_tsquery('portuguese', $${paramIndex} || ':*')`);
            queryParams.push(filters.secretaria_concedente);
            paramIndex++;
        }

        if (filters.orgao_concedente_id) {
            whereConditions.push(`projeto.orgao_concedente_id = $${paramIndex}`);
            queryParams.push(filters.orgao_concedente_id);
            paramIndex++;
        }

        if (filters.partido_id) {
            whereConditions.push(`projeto.partido_id = $${paramIndex}`);
            queryParams.push(filters.partido_id);
            paramIndex++;
        }

        whereConditions.push(`t.removido_em IS NULL`);

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        return { whereString, queryParams };
    }

    private convertRowsTransferenciasInto(input: RetornoDbTransferencias[], out: RelTransferenciasDto[]) {
        for (const db of input) {
            out.push({
                id: db.id,
                identificador: db.identificador,
                ano: db.ano,
                objeto: db.objeto,
                detalhamento: db.detalhamento,
                critico: db.critico,
                clausula_suspensiva: db.clausula_suspensiva,
                clausula_suspensiva_vencimento: db.clausula_suspensiva_vencimento,
                normativa: db.normativa,
                observacoes: db.observacoes,
                programa: db.programa,
                empenho: db.empenho,
                pendente_preenchimento_valores: db.pendente_preenchimento_valores,
                valor: db.valor ? db.valor : null,
                valor_total: db.valor_total ? db.valor_total : null,
                valor_contrapartida: db.valor_contrapartida ? db.valor_contrapartida : null,
                emenda: db.emenda,
                dotacao: db.dotacao,
                demanda: db.demanda,
                banco_fim: db.banco_fim,
                conta_fim: db.conta_fim,
                agencia_fim: db.agencia_fim,
                banco_aceite: db.banco_aceite,
                conta_aceite: db.conta_aceite,
                nome_programa: db.nome_programa,
                agencia_aceite: db.agencia_aceite,
                emenda_unitaria: db.emenda_unitaria,
                gestor_contrato: db.gestor_contrato,
                ordenador_despesa: db.ordenador_despesa,
                numero_identificacao: db.numero_identificacao,
                secretaria_concedente: db.secretaria_concedente,
                interface: db.interface,
                esfera: db.esfera,
                cargo: db.cargo,

                partido: db.partido_id
                    ? {
                          id: db.partido_id,
                          sigla: db.partido_sigla,
                      }
                    : null,

                orgao_concedente: {
                    id: db.orgao_concedente_id,
                    descricao: db.orgao_concedente_descricao,
                    sigla: db.orgao_concedente_sigla,
                },

                parlamentar: db.parlamentar_id
                    ? {
                          id: db.parlamentar_id,
                          nome: db.parlamentar_nome,
                          nome_popular: db.parlamentar_nome_popular,
                      }
                    : null,
            });
        }
    }

    async getFiles(myInput: any, params: any): Promise<FileOutput[]> {
        const dados = myInput as TransferenciasRelatorioDto;

        const out: FileOutput[] = [];

        if (dados.linhas.length) {
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
                name: 'transferencias.csv',
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
