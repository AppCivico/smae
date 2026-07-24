import { BaseDataSourceProvider, ColumnSchema, ColumnType, LoadContext } from 'duckdb-report-builder';
import { ReportColumnType, ReportFileSchema } from './report-schema';

/**
 * Mapeia o tipo declarado no schema para o `ColumnType` (mais restrito) da lib.
 * Só afeta os metadados de validação — a leitura real usa o tipo DuckDB completo,
 * e `.format()` redescobre os tipos via `information_schema.columns`.
 */
function toProviderType(type: ReportColumnType): ColumnType {
    if (type.startsWith('DECIMAL')) return 'DOUBLE';
    return type as ColumnType;
}

export function quoteIdent(name: string): string {
    return '"' + name.replace(/"/g, '""') + '"';
}

function quoteLiteral(value: string): string {
    return "'" + value.replace(/'/g, "''") + "'";
}

/**
 * Carrega um CSV bruto no DuckDB usando os tipos declarados no schema.
 *
 * Usa `read_csv(..., columns={...})` em vez de `read_csv_auto`, o que garante que
 * DECIMAL não seja inferido como DOUBLE (perda de precisão em valores monetários) e
 * que identificadores como `0001.02` permaneçam VARCHAR em vez de virarem número.
 */
export class CsvSchemaProvider extends BaseDataSourceProvider {
    readonly name = 'csv-schema';

    constructor(
        private readonly csvPath: string,
        private readonly fileSchema: ReportFileSchema,
        // O CSV bruto é escrito pelo json2csv com o delimitador padrão (vírgula);
        // o ';' aparece só na SAÍDA pós-processada, por ser o separador do Excel pt-BR.
        private readonly delimiter: string = ','
    ) {
        super();
        this.schema = fileSchema.colunas.map(
            (c): ColumnSchema => ({
                name: c.name,
                type: toProviderType(c.type),
                nullable: true,
            })
        );
    }

    async load(context: LoadContext): Promise<string> {
        const table = this.generateTableName('raw_csv');

        const columns = this.fileSchema.colunas
            .map((c) => `${quoteLiteral(c.name)}: ${quoteLiteral(c.type)}`)
            .join(', ');

        const sql = `CREATE OR REPLACE TABLE ${quoteIdent(table)} AS
            SELECT * FROM read_csv(
                ${quoteLiteral(this.csvPath)},
                delim = ${quoteLiteral(this.delimiter)},
                header = true,
                columns = {${columns}},
                nullstr = '',
                all_varchar = false
            )`;

        await context.connection.run(sql);
        return table;
    }
}
