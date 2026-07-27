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
 *
 * Além dos tipos, o **dialeto** (aspa, escape, quebra de linha) também é declarado — ver o
 * comentário em `load()`. Tipo declarado com dialeto adivinhado ainda deixava o conteúdo das
 * células à mercê de uma amostragem do arquivo.
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

        // Dialeto declarado por inteiro, não inferido.
        //
        // Mesmo com `columns` explícito, o DuckDB ainda deduz aspas/escape/quebra de linha a
        // partir de uma amostra do arquivo — e amostra é função dos dados. Um CSV cujo texto
        // contenha muitos apóstrofos pode levar o detector a eleger `'` como aspa, e aí um
        // campo perfeitamente válido passa a ser lido torto. Como quem escreve estes arquivos
        // é o próprio SMAE (json2csv com `DefaultCsvOptions`, ou o `CsvFileHandler`), o
        // dialeto é conhecido de antemão: não há motivo para adivinhar.
        //
        // O que isto NÃO resolve — medido, para não virar falsa sensação de segurança: arquivo
        // com terminador de registro **misto** (cabeçalho `\r\n` e linhas `\n`) continua sendo
        // aceito ou rejeitado conforme os dados, porque `new_line` é conferido no cabeçalho.
        // Contra isso o que vale é o writer emitir EOL consistente.
        const sql = `CREATE OR REPLACE TABLE ${quoteIdent(table)} AS
            SELECT * FROM read_csv(
                ${quoteLiteral(this.csvPath)},
                delim = ${quoteLiteral(this.delimiter)},
                header = true,
                columns = {${columns}},
                nullstr = '',
                all_varchar = false,
                new_line = '\\r\\n',
                quote = '"',
                escape = '"'
            )`;

        await context.connection.run(sql);
        return table;
    }
}
