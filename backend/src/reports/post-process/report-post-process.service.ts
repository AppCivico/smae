import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
    ): Promise<FileOutput[]> {
        const out: FileOutput[] = [];

        for (const file of files) {
            const schema = findFileSchema(schemas, file.name);
            const cfg = modelo.arquivos.find((a) => a.arquivo === file.name);

            if (!schema || !cfg || !file.localFile) {
                out.push(file);
                continue;
            }

            const colunas = this.resolverColunas(schema, cfg);
            const filtros = compilarFiltros(cfg.filtros ?? [], schema.colunas);

            const csvOut = tmpFile('pp-csv', '.csv');
            await this.executar(file.localFile, schema, cfg, colunas, filtros, csvOut, 'csv');
            out.push({ name: file.name, localFile: csvOut });

            const xlsxOut = await this.gerarXlsx(file.localFile, schema, cfg, colunas, filtros, modelo);
            out.push({ name: file.name.replace(/\.csv$/, '.xlsx'), localFile: xlsxOut });

            try {
                fs.unlinkSync(file.localFile);
            } catch (e) {
                this.logger.warn(`Falha ao remover CSV bruto ${file.localFile}: ${e}`);
            }
        }

        return out;
    }

    /**
     * Resolve a lista final de colunas: a seleção do modelo (na ordem escolhida) ou,
     * na ausência dela, todas as colunas do schema na ordem declarada. Labels e
     * formatação do modelo sobrescrevem os padrões do schema.
     */
    private resolverColunas(schema: ReportFileSchema, cfg: RelatorioModeloArquivoDto): ReportColumnDef[] {
        if (!cfg.colunas?.length) return schema.colunas;

        const porNome = new Map(schema.colunas.map((c) => [c.name, c]));

        return cfg.colunas.map((sel) => {
            const def = porNome.get(sel.coluna);
            if (!def)
                throw new BadRequestException(`Coluna "${sel.coluna}" não existe no relatório ${schema.arquivo}.`);

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
     * Valida `order_by` contra o schema antes de o nome virar identificador de `ORDER BY`.
     *
     * Não é redundante com a validação de `validaConfig`: `quoteIdent` do lado da lib
     * (`quoteIdentifier`) envolve o nome em `"` mas **não** escapa `"` interno, então um nome
     * arbitrário escaparia do identificador. A config só entra no banco pelo CRUD, que valida,
     * mas aqui é o único ponto do runtime que ainda confiava no nome sem conferir — `colunas` e
     * `filtros` já checam. Fecha a assimetria e protege contra config antiga/schema alterado.
     */
    private resolverOrdenacao(schema: ReportFileSchema, cfg: RelatorioModeloArquivoDto): RelatorioModeloOrdemDto[] {
        const ordens = cfg.order_by ?? [];
        if (!ordens.length) return [];

        const validas = new Set(schema.colunas.map((c) => c.name));

        for (const o of ordens) {
            if (!validas.has(o.coluna))
                throw new BadRequestException(
                    `Ordenação inválida: coluna "${o.coluna}" não existe no relatório ${schema.arquivo}.`
                );
        }

        return ordens;
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
        cfg: RelatorioModeloArquivoDto,
        colunas: ReportColumnDef[],
        filtros: string[],
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
        for (const o of this.resolverOrdenacao(schema, cfg)) report.orderBy(o.coluna, o.direcao);

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
                columns[c.name] = { rename: c.label };
                continue;
            }

            const fmt = c.format ?? {};
            columns[c.name] = {
                rename: c.label,
                // O guard já produziu VARCHAR no SELECT; formatar de novo corromperia o valor.
                ...(fmt.excelTextGuard || fmt.raw ? { raw: true } : {}),
                ...(fmt.decimalPlaces !== undefined ? { decimalPlaces: fmt.decimalPlaces } : {}),
                ...(fmt.currency ? { currency: fmt.currency } : {}),
                ...(fmt.unit ? { unit: fmt.unit } : {}),
                ...(fmt.dateFormat ? { dateFormat: fmt.dateFormat } : {}),
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
        cfg: RelatorioModeloArquivoDto,
        colunas: ReportColumnDef[],
        filtros: string[],
        modelo: RelatorioModeloConfigDto
    ): Promise<string> {
        const tipado = modelo.xlsx_tipado !== false;
        const xlsx = tmpFile('pp-xlsx', '.xlsx');

        // Etapa intermediária: parquet quando tipado (preserva DECIMAL/DATE), CSV quando
        // o modelo pede o XLSX espelhando a apresentação do CSV.
        const ponte = tipado ? tmpFile('pp-ponte', '.parquet') : tmpFile('pp-ponte', '.csv');
        await this.executar(csvPath, schema, cfg, colunas, filtros, ponte, tipado ? 'parquet' : 'csv');

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
