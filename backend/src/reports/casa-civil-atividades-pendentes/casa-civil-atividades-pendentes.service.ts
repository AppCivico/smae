import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, DefaultTransforms, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateCasaCivilAtividadesPendentesFilterDto } from './dto/create-casa-civil-atv-pend-filter.dto';
import { RelCasaCivilAtividadesPendentes } from './entities/casa-civil-atividaes-pendentes.entity';
import { Prisma } from '@prisma/client';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { flatten } from '@json2csv/transforms';

@Injectable()
export class CasaCivilAtividadesPendentesService implements ReportableService {
    constructor(private readonly prisma: PrismaService) {}

    async asJSON(params: CreateCasaCivilAtividadesPendentesFilterDto): Promise<RelCasaCivilAtividadesPendentes[]> {
        // Build dynamic WHERE conditions using Prisma.sql template
        let whereConditions = Prisma.sql`
        tc.removido_em is null
        AND t.removido_em is null
        AND tf.removido_em is null
        AND tf.termino_real is null
        AND tf.termino_planejado < now()::date
    `;

        if (params.tipo_id && params.tipo_id.length > 0)
            whereConditions = Prisma.sql`${whereConditions} AND tt.id = ANY(${params.tipo_id})`;

        if (params.data_inicio) {
            const dataInicio = Date2YMD.toString(params.data_inicio);
            whereConditions = Prisma.sql`${whereConditions} AND tf.inicio_planejado >= ${dataInicio}::date`;
        }

        if (params.data_termino) {
            const dataTermino = Date2YMD.toString(params.data_termino);
            whereConditions = Prisma.sql`${whereConditions} AND tf.termino_planejado <= ${dataTermino}::date`;
        }

        if (params.esfera)
            whereConditions = Prisma.sql`${whereConditions} AND t.esfera = ${params.esfera}::"TransferenciaTipoEsfera"`;

        if (params.orgao_id && params.orgao_id.length > 0)
            whereConditions = Prisma.sql`${whereConditions} AND tf.orgao_id = ANY(${params.orgao_id})`;

        const linhas = await this.prisma.$queryRaw`
        SELECT
            t.identificador,
            (
                SELECT string_agg(p.nome::text, ', ')
                FROM parlamentar p
                INNER JOIN transferencia_parlamentar tp ON p.id = tp.parlamentar_id AND tp.transferencia_id = t.id
            ) as parlamentares,
            t.valor AS valor,
            tf.tarefa as atividade,
            tf.inicio_planejado AS inicio_planejado,
            tf.termino_planejado AS termino_planejado,
            tf.inicio_real AS inicio_real,
            o.sigla as orgao_responsavel,
            tf.recursos as responsavel_atividade
        FROM tarefa_cronograma tc
        INNER JOIN tarefa tf ON tf.tarefa_cronograma_id = tc.id
        INNER JOIN transferencia t ON t.id = tc.transferencia_id
        INNER JOIN transferencia_tipo tt ON tt.id = t.tipo_id
        LEFT JOIN orgao o ON o.id = tf.orgao_id
        WHERE ${whereConditions}
    `;

        return linhas as RelCasaCivilAtividadesPendentes[];
    }

    async toFileOutput(params: CreateCasaCivilAtividadesPendentesFilterDto, ctx: ReportContext): Promise<FileOutput[]> {
        const rows = await this.asJSON(params);
        await ctx.progress(40);
        //Cabeçalho Arquivo
        const fieldsCSV = [
            { value: 'identificador', label: 'Identificador' },
            { value: 'parlamentares', label: 'Parlamentares' },
            {
                value: (row: { valor: number | null }) =>
                    row.valor != null
                        ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                          }).format(row.valor)
                        : '',
                label: 'Valor do Repasse',
            },
            { value: 'atividade', label: 'Atividade' },
            {
                value: (row: any) =>
                    row.inicio_planejado ? `="${new Date(row.inicio_planejado).toLocaleDateString('pt-BR')}"` : '',
                label: 'Previsão de Início',
            },
            {
                value: (row: any) =>
                    row.termino_planejado ? `="${new Date(row.termino_planejado).toLocaleDateString('pt-BR')}"` : '',
                label: 'Previsão de Término',
            },
            {
                value: (row: any) =>
                    row.inicio_real ? `="${new Date(row.inicio_real).toLocaleDateString('pt-BR')}"` : '',
                label: 'Início Real',
            },
            { value: 'orgao_responsavel', label: 'Orgão Responsável' },
            { value: 'responsavel_atividade', label: 'Responsável pela Atividade' },
        ];

        const out: FileOutput[] = [];
        if (rows.length) {
            const tmp = ctx.getTmpFile('atividades-pendentes.csv');

            const csvOpts: CsvWriterOptions<any> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: fieldsCSV,
            };
            await WriteCsvToFile(rows, tmp.stream, csvOpts);
            out.push({
                name: 'atividades-pendentes.csv',
                localFile: tmp.path,
            });
            await ctx.resumoSaida('Atividades Pendentes', rows.length);
        }
        return out;
    }
}
