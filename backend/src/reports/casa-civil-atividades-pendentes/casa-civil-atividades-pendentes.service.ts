import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateCasaCivilAtividadesPendentesFilterDto } from './dto/create-casa-civil-atv-pend-filter.dto';
import { RelCasaCivilAtividadesPendentes } from './entities/casa-civil-atividaes-pendentes.entity';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class CasaCivilAtividadesPendentesService implements ReportableService {
    constructor(private readonly prisma: PrismaService) {}
    async asJSON(params: CreateCasaCivilAtividadesPendentesFilterDto): Promise<RelCasaCivilAtividadesPendentes[]> {
        let sql = ` select
                        t.identificador,
                        (
                            select string_agg(p.nome::text, ', ')
                            from parlamentar p
                            inner join transferencia_parlamentar tp on p.id = tp.parlamentar_id and tp.transferencia_id = t.id
                        ) as parlamentares,
                        t.valor AS valor,
                        tf.tarefa as atividade,
                        tf.inicio_planejado AS inicio_planejado,
                        tf.termino_planejado AS termino_planejado,
                        tf.inicio_real AS inicio_real,
                        o.sigla as orgao_responsavel,
                        tf.recursos as responsavel_atividade
                        from tarefa_cronograma tc
                        inner join tarefa tf on tf.tarefa_cronograma_id = tc.id
                        inner join transferencia t on t.id = tc.transferencia_id
                        inner join transferencia_tipo tt on tt.id = t.tipo_id
                        left join orgao o on o.id = tf.orgao_id
                        where
                        tc.removido_em is null
                        and t.removido_em is null
                        and tf.removido_em is null
                        and tf.termino_real is null
                        `;
        if (params.tipo_id && params.tipo_id.length > 0) {
            sql += ' and tt.id in (' + params.tipo_id.toString() + ')';
        }
        if (params.data_inicio) {
            sql += " and tf.inicio_planejado >= '" + Date2YMD.toString(params.data_inicio) + "'";
        }
        if (params.data_termino) {
            sql += " and tf.inicio_planejado <= '" + Date2YMD.toString(params.data_termino) + "'";
        }
        if (params.orgao_id && params.orgao_id.length > 0) {
            sql += ' and tf.orgao_id in(' + params.orgao_id.toString() + ')';
        }
        const linhas = await this.prisma.$queryRawUnsafe(sql);
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
                    row.inicio_planejado ? new Date(row.inicio_planejado).toLocaleDateString('pt-BR') : '',
                label: 'Previsão de Início',
            },
            {
                value: (row: any) =>
                    row.termino_planejado ? new Date(row.termino_planejado).toLocaleDateString('pt-BR') : '',
                label: 'Previsão de Término',
            },
            {
                value: (row: any) => (row.inicio_real ? new Date(row.inicio_real).toLocaleDateString('pt-BR') : ''),
                label: 'Início Real',
            },

            { value: 'orgao_responsavel', label: 'Orgão Responsável' },
            { value: 'responsavel_atividade', label: 'Responsável pela Atividade' },
        ];

        const out: FileOutput[] = [];
        if (rows.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: fieldsCSV,
            });
            const linhas = json2csvParser.parse(rows);
            out.push({
                name: 'casa-civil-atividades-pendentes.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }
        return out;
    }
}
