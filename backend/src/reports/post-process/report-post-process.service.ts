import { Injectable, Logger } from '@nestjs/common';
import { DuckDBInstance } from '@duckdb/node-api';
import { ColumnFormatConfig, FormatConfig, ReportWithContext } from 'duckdb-report-builder';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileOutput } from '../utils/utils.service';
import { CsvSchemaProvider, quoteIdent } from './csv-schema.provider';
import {
    RelatorioModeloArquivoDto,
    RelatorioModeloConfigDto,
    RelatorioModeloOrdemDto,
} from './dto/relatorio-modelo.dto';
import { compilarFiltros } from './filtro-compiler';
import { ReportColumnDef, ReportFileSchema, findFileSchema } from './report-schema';

const DUCKDB_SETTINGS = { threads: '1', memory_limit: '800MB' };

let tmpSeq = 0;

/**
 * Nome de arquivo temporário local.
 *
 * Deliberadamente não reusa `GetTempFileName` de `reports.service`: o ReportsService
 * consome este serviço, e importar de volta fecharia um ciclo de módulos.
 */
function tmpFile(prefix: string, suffix: string): string {
    return path.join(os.tmpdir(), `${prefix}-${process.pid}-${Date.now()}-${tmpSeq++}${suffix}`);
}

/** Literal SQL de caminho de arquivo (só caminhos gerados internamente passam por aqui). */
function sqlLit(value: string): string {
    return "'" + value.replace(/'/g, "''") + "'";
}

/**
 * Pré-escapa `"` para o `quoteIdentifier` do duckdb-report-builder.
 *
 * A lib envolve o nome em aspas mas **não** dobra as internas (`cte-builder.js`), então um
 * label cru vindo do modelo escaparia do identificador: `X" , 999 AS "PWNED` virava uma
 * coluna extra com SQL arbitrário. Dobrando aqui, o `"a""b"` que a lib emite é um
 * identificador válido que significa `a"b` — o label continua sendo exibido como escrito.
 */
function renameSeguro(label: string): string {
    return label.replace(/"/g, '""');
}

/**
 * Pré-escapa `'` para o `strftime(col, '<fmt>')` que a lib monta por interpolação, sem
 * escapar (`format-generator.js`). Sem isto, `%Y') || 'VAZOU' || strftime(d, '%m` saía do
 * literal e executava SQL arbitrário. O DTO ainda restringe o formato por regex; este
 * escape é a segunda barreira, para o caso de a validação mudar.
 */
function dateFormatSeguro(fmt: string): string {
    return fmt.replace(/'/g, "''");
}

/** Referência do modelo que o schema atual não tem mais. */
export type ModeloReferenciaIgnorada = {
    arquivo: string;
    onde: 'colunas' | 'filtros' | 'order_by';
    coluna: string;
};

export type AplicarModeloResultado = {
    arquivos: FileOutput[];
    /**
     * O que foi degradado por não existir no schema atual. Vai para o `resumo_saida` do
     * relatório: o modelo não falha, mas a perda não pode ser silenciosa.
     */
    ignoradas: ModeloReferenciaIgnorada[];
};

@Injectable()
export class ReportPostProcessService {
    private readonly logger = new Logger(ReportPostProcessService.name);

    /**
     * Aplica um modelo sobre os arquivos brutos de um relatório.
     *
     * Para cada arquivo com schema declarado, produz dois artefatos a partir da mesma
     * tabela tipada:
     *
     *   - **CSV**: formatação pt-BR completa (moeda, datas dd/mm/aaaa) + labels + o
     *     `excelTextGuard` onde declarado, porque o CSV não carrega schema.
     *   - **XLSX**: apenas renomeação, tipos nativos preservados — células somáveis no
     *     Excel. Nunca recebe o guard `="..."`, então `fixFormulaStringsInXlsx` deixa de
     *     ser necessário neste caminho.
     *
     * Arquivos sem schema (ou sem entrada no modelo) são devolvidos intactos, para o
     * caminho legado de `zipFiles`.
     */
    async aplicarModelo(
        files: FileOutput[],
        schemas: ReportFileSchema[],
        modelo: RelatorioModeloConfigDto
    ): Promise<AplicarModeloResultado> {
        const out: FileOutput[] = [];
        const ignoradas: ModeloReferenciaIgnorada[] = [];

        for (const file of files) {
            const schema = findFileSchema(schemas, file.name);
            const cfg = modelo.arquivos.find((a) => a.arquivo === file.name);

            if (!schema || !cfg || !file.localFile) {
                out.push(file);
                continue;
            }

            const registrar = (onde: ModeloReferenciaIgnorada['onde'], coluna: string) => {
                ignoradas.push({ arquivo: file.name, onde, coluna });
                this.logger.warn(
                    `Modelo referencia "${coluna}" em ${onde} de ${file.name}, que não existe no schema atual.`
                );
            };

            const colunas = this.resolverColunas(schema, cfg, registrar);
            // Filtro sobre coluna ausente é descartado, não convertido para NULL: `col = 'x'`
            // com col NULL nunca é verdadeiro e devolveria um relatório vazio — pior que
            // devolver as linhas sem aquele recorte.
            const filtros = compilarFiltros(cfg.filtros ?? [], schema.colunas, (c) => registrar('filtros', c));
            const ordens = this.resolverOrdenacao(schema, cfg, registrar);

            const csvOut = tmpFile('pp-csv', '.csv');
            await this.executar(file.localFile, schema, colunas, filtros, ordens, csvOut, 'csv');
            out.push({ name: file.name, localFile: csvOut });

            const xlsxOut = await this.gerarXlsx(file.localFile, schema, colunas, filtros, ordens, modelo);
            out.push({ name: file.name.replace(/\.csv$/, '.xlsx'), localFile: xlsxOut });

            try {
                fs.unlinkSync(file.localFile);
            } catch (e) {
                this.logger.warn(`Falha ao remover CSV bruto ${file.localFile}: ${e}`);
            }
        }

        return { arquivos: out, ignoradas };
    }

    /**
     * Resolve a lista final de colunas: a seleção do modelo (na ordem escolhida) ou,
     * na ausência dela, todas as colunas do schema na ordem declarada. Labels e
     * formatação do modelo sobrescrevem os padrões do schema.
     *
     * Coluna que o schema atual não tem mais **não** derruba o relatório: ela sai como NULL,
     * na posição pedida, com o nome como cabeçalho. Um modelo salvo hoje precisa continuar
     * rodando depois de uma coluna ser removida do relatório — falhar aqui significaria
     * perder a extração inteira (que pode levar horas) por uma coluna cosmética.
     * A validação estrita segue valendo na criação/edição do modelo (`validaConfig`), onde
     * uma coluna inexistente é erro de digitação e não deriva de mudança de schema.
     */
    private resolverColunas(
        schema: ReportFileSchema,
        cfg: RelatorioModeloArquivoDto,
        registrar: (onde: ModeloReferenciaIgnorada['onde'], coluna: string) => void
    ): ReportColumnDef[] {
        if (!cfg.colunas?.length) return schema.colunas;

        const porNome = new Map(schema.colunas.map((c) => [c.name, c]));

        return cfg.colunas.map((sel, i) => {
            const def = porNome.get(sel.coluna);

            if (!def) {
                registrar('colunas', sel.coluna);
                return {
                    // Identificador gerado: o nome vindo do modelo nunca vira identificador SQL.
                    name: `coluna_ausente_${i}`,
                    type: 'VARCHAR' as const,
                    label: sel.label ?? sel.coluna,
                    format: { raw: true },
                    ausente: true,
                };
            }

            return {
                ...def,
                label: sel.label ?? def.label,
                format: {
                    ...def.format,
                    ...(sel.decimais !== undefined ? { decimalPlaces: sel.decimais } : {}),
                    ...(sel.formato_data !== undefined ? { dateFormat: sel.formato_data } : {}),
                },
            };
        });
    }

    /**
     * Resolve `order_by`, mantendo a ordem declarada — a lista inteira vira
     * `ORDER BY a ASC, b DESC, ...`, então ordenação por vários campos é o caso normal.
     *
     * Cada nome é conferido contra o schema **antes** de virar identificador de `ORDER BY`:
     * o `quoteIdentifier` da lib envolve em `"` mas não escapa `"` interno, então um nome não
     * validado escaparia do identificador. Coluna que não existe mais é descartada (e
     * registrada), pelo mesmo motivo de `resolverColunas`: não vale perder a extração inteira.
     * Ordenar por coluna ausente não teria efeito de qualquer forma — seria tudo NULL.
     */
    private resolverOrdenacao(
        schema: ReportFileSchema,
        cfg: RelatorioModeloArquivoDto,
        registrar: (onde: ModeloReferenciaIgnorada['onde'], coluna: string) => void
    ): RelatorioModeloOrdemDto[] {
        const ordens = cfg.order_by ?? [];
        if (!ordens.length) return [];

        const validas = new Set(schema.colunas.map((c) => c.name));

        return ordens.filter((o) => {
            if (validas.has(o.coluna)) return true;
            registrar('order_by', o.coluna);
            return false;
        });
    }

    /**
     * Monta e executa o pipeline DuckDB, escrevendo direto em arquivo (nenhuma linha
     * é materializada no heap do Node).
     *
     * `saida` controla a semântica de formatação:
     *   - `csv`   → formatação completa + labels + guard de texto
     *   - `parquet` → apenas renomeação, tipos nativos (etapa intermediária do XLSX)
     */
    private async executar(
        csvPath: string,
        schema: ReportFileSchema,
        colunas: ReportColumnDef[],
        filtros: string[],
        ordens: RelatorioModeloOrdemDto[],
        destino: string,
        saida: 'csv' | 'parquet'
    ): Promise<number> {
        const report = new ReportWithContext()
            .duckdb({ settings: DUCKDB_SETTINGS })
            // from/until são exigidos pelo contexto da lib mas irrelevantes aqui: o
            // recorte temporal já aconteceu na extração; o CSV bruto é a fonte inteira.
            .context({ from: new Date(0), until: new Date('9999-12-31'), timezone: 'America/Sao_Paulo' })
            .load('raw', new CsvSchemaProvider(csvPath, schema));

        // No CSV, colunas com excelTextGuard viram expressão VARCHAR já envolvida em
        // `="..."`. No parquet/XLSX a coluna segue com o tipo nativo.
        report.select(
            colunas.map((c) => {
                // Coluna que o schema não tem mais: NULL tipado, para o parquet/XLSX ter tipo.
                if (c.ausente) return [`CAST(NULL AS VARCHAR)`, c.name] as [string, string];

                if (saida === 'csv' && c.format?.excelTextGuard) {
                    const id = quoteIdent(c.name);
                    return [
                        `CASE WHEN ${id} IS NULL THEN '' ELSE '="' || replace(${id}::VARCHAR, '"', '""') || '"' END`,
                        c.name,
                    ] as [string, string];
                }
                return c.name;
            })
        );

        for (const f of filtros) report.filter(f);
        // A lib acumula (`outputOrderBy.push`) e emite `ORDER BY a, b, ...` na ordem recebida.
        for (const o of ordens) report.orderBy(o.coluna, o.direcao);

        report.format(this.montarFormatConfig(colunas, saida));

        try {
            const res = await report.buildToFile(destino, { format: saida, delimiter: ';', header: true });
            return res.rowCount;
        } finally {
            await report.close();
        }
    }

    /**
     * Traduz o schema + modelo para o `FormatConfig` da lib.
     *
     * Para parquet (base do XLSX) só o `rename` é emitido — a lib já ignora casting de
     * tipo nesse formato, mas manter a config enxuta deixa a intenção explícita.
     */
    private montarFormatConfig(colunas: ReportColumnDef[], saida: 'csv' | 'parquet'): FormatConfig {
        const columns: Record<string, ColumnFormatConfig> = {};

        for (const c of colunas) {
            if (saida === 'parquet') {
                columns[c.name] = { rename: renameSeguro(c.label) };
                continue;
            }

            const fmt = c.format ?? {};
            columns[c.name] = {
                rename: renameSeguro(c.label),
                // O guard já produziu VARCHAR no SELECT; formatar de novo corromperia o valor.
                ...(fmt.excelTextGuard || fmt.raw ? { raw: true } : {}),
                ...(fmt.decimalPlaces !== undefined ? { decimalPlaces: fmt.decimalPlaces } : {}),
                ...(fmt.currency ? { currency: fmt.currency } : {}),
                ...(fmt.unit ? { unit: fmt.unit } : {}),
                ...(fmt.dateFormat ? { dateFormat: dateFormatSeguro(fmt.dateFormat) } : {}),
            };
        }

        return { locale: 'pt-BR', columns };
    }

    /**
     * Gera o XLSX em duas etapas: parquet tipado (renomeação apenas) e depois
     * `COPY ... TO ... (FORMAT xlsx)`.
     *
     * O parquet intermediário existe porque a lib ainda não tem sink XLSX; usá-lo como
     * ponte preserva DECIMAL/DATE de ponta a ponta, ao contrário do caminho antigo, que
     * relia um CSV já formatado com `read_csv_auto`.
     */
    private async gerarXlsx(
        csvPath: string,
        schema: ReportFileSchema,
        colunas: ReportColumnDef[],
        filtros: string[],
        ordens: RelatorioModeloOrdemDto[],
        modelo: RelatorioModeloConfigDto
    ): Promise<string> {
        const tipado = modelo.xlsx_tipado !== false;
        const xlsx = tmpFile('pp-xlsx', '.xlsx');

        // Etapa intermediária: parquet quando tipado (preserva DECIMAL/DATE), CSV quando
        // o modelo pede o XLSX espelhando a apresentação do CSV.
        const ponte = tipado ? tmpFile('pp-ponte', '.parquet') : tmpFile('pp-ponte', '.csv');
        await this.executar(csvPath, schema, colunas, filtros, ordens, ponte, tipado ? 'parquet' : 'csv');

        const instance = await DuckDBInstance.create(':memory:', DUCKDB_SETTINGS);
        const con = await instance.connect();
        try {
            await con.run('LOAD excel');
            const fonte = tipado
                ? `read_parquet(${sqlLit(ponte)})`
                : `read_csv(${sqlLit(ponte)}, delim = ';', header = true, all_varchar = true)`;
            await con.run(`COPY (SELECT * FROM ${fonte}) TO ${sqlLit(xlsx)} (FORMAT xlsx, HEADER true)`);
        } finally {
            con.disconnectSync();
            try {
                fs.unlinkSync(ponte);
            } catch {
                /* arquivo temporário */
            }
        }

        return xlsx;
    }
}
