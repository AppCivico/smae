import { Injectable } from '@nestjs/common';
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
import { CreateCasaCivilAtividadesPendentesFilterDto } from './dto/create-casa-civil-atv-pend-filter.dto';
import { RelCasaCivilAtividadesPendentesCsvRow } from './entities/casa-civil-atividades-pendentes-csv.entity';
import { RelCasaCivilAtividadesPendentes } from './entities/casa-civil-atividaes-pendentes.entity';
import { Prisma } from '@prisma/client';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';

/** Formato cru devolvido pelo `$queryRaw`, antes da normalização feita no `asJSON`. */
type RetornoDbAtvPendentes = {
    identificador: string;
    parlamentares: string | null;
    valor: Prisma.Decimal | null;
    atividade: string;
    inicio_planejado: Date | null;
    termino_planejado: Date | null;
    inicio_real: Date | null;
    orgao_responsavel: string | null;
    responsavel_atividade: string;
};

@Injectable()
export class CasaCivilAtividadesPendentesService implements ReportableService, SchemaAwareReportableService {
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

        const linhas = await this.prisma.$queryRaw<RetornoDbAtvPendentes[]>`
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

        // Normaliza para o "compute store": datas em ISO `YYYY-MM-DD` e o Decimal do Prisma
        // como string (ver comentário em RelCasaCivilAtividadesPendentesCsvRow.valor).
        // Nenhuma máscara de moeda/locale aqui — isso é do pós-processamento.
        return linhas.map((r) => {
            return {
                identificador: r.identificador,
                parlamentares: r.parlamentares,
                valor: r.valor != null ? r.valor.toString() : null,
                atividade: r.atividade,
                inicio_planejado: Date2YMD.toStringOrNull(r.inicio_planejado),
                termino_planejado: Date2YMD.toStringOrNull(r.termino_planejado),
                inicio_real: Date2YMD.toStringOrNull(r.inicio_real),
                orgao_responsavel: r.orgao_responsavel,
                responsavel_atividade: r.responsavel_atividade,
            } satisfies RelCasaCivilAtividadesPendentes;
        });
    }

    async describeSchema(_params: CreateCasaCivilAtividadesPendentesFilterDto): Promise<ReportFileSchema[]> {
        return [getReportRowSchema(RelCasaCivilAtividadesPendentesCsvRow)];
    }

    async toFileOutput(params: CreateCasaCivilAtividadesPendentesFilterDto, ctx: ReportContext): Promise<FileOutput[]> {
        const rows = await this.asJSON(params);
        await ctx.progress(40);

        const [schema] = await this.describeSchema(params);

        const out: FileOutput[] = [];
        if (rows.length) {
            const tmp = ctx.getTmpFile('atividades-pendentes.csv');

            // CSV bruto: cabeçalho com os nomes de máquina das colunas, sem rótulos e sem
            // lambdas de formatação. Rótulos, moeda, data pt-BR e o guard do Excel vêm do
            // schema declarado em RelCasaCivilAtividadesPendentesCsvRow, aplicado no
            // pós-processamento.
            const csvOpts: CsvWriterOptions<RelCasaCivilAtividadesPendentes> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: schema.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(rows, tmp.stream, csvOpts);
            out.push({
                name: 'atividades-pendentes.csv',
                localFile: tmp.path,
            });
        }
        await ctx.resumoSaida('Atividades Pendentes', rows.length);

        return out;
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
