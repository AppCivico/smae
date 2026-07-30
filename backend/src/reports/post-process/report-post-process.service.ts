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
import {
    ColunasDaFonte,
    ModeloReferenciaIgnorada,
    registradorDeReferencias,
    resolverColunasDoModelo,
} from './modelo-colunas';
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
 * Nome da aba do XLSX, a partir do nome do arquivo do relatório — sem isto toda aba sai
 * como o "Sheet1" do DuckDB, o que é ruim quando o usuário abre vários relatórios juntos.
 *
 * O Excel limita a aba a 31 caracteres e proíbe `: \ / ? * [ ]`; o DuckDB não valida nada
 * disso, então é aqui ou é arquivo corrompido.
 */
function nomeAba(arquivo: string): string {
    const base = arquivo
        .replace(/\.csv$/i, '')
        .replace(/[:\\/?*[\]]/g, '-')
        .slice(0, 31);
    return base || 'Dados';
}

/**
 * Modelo implícito: todas as colunas de cada arquivo, na ordem declarada, com os labels e a
 * formatação que o próprio schema já descreve. Sem seleção, sem filtro, sem ordenação.
 *
 * Existe porque a extração dos serviços com schema deixou de formatar — agora emite "compute
 * store" (número como número, data ISO, sem máscara de moeda e sem o guard `="..."`). Sem passar
 * pelo pós-processamento, esses relatórios sairiam com cabeçalho técnico (`valor_contrapartida`
 * em vez de "Contrapartida") e valores crus, ou seja *pior* que antes do schema existir. Como os
 * decoradores `@ReportColumn` foram escritos a partir da formatação antiga, aplicar o schema
 * inteiro é justamente o que reproduz a saída de antes.
 */
export function modeloPadraoDeSchemas(schemas: ReportFileSchema[]): RelatorioModeloConfigDto {
    return { arquivos: schemas.map((s) => ({ arquivo: s.arquivo })) };
}

export type { ColunasDaFonte, ModeloReferenciaIgnorada };

export type AplicarModeloResultado = {
    arquivos: FileOutput[];
    /**
     * Referência que a fonte **não conhece mais** — modelo salvo antes de a coluna ser
     * removida do relatório. Vai para o `resumo_saida`: o modelo não falha, mas a perda não
     * pode ser silenciosa.
     */
    ignoradas: ModeloReferenciaIgnorada[];
    /**
     * Referência recortada por não se aplicar a **estes parâmetros** — meta/iniciativa/
     * atividade num orçamento de projeto, `mes`/`ano` num Consolidado. Situação normal: o
     * modelo é montado uma vez, sobre a união das variantes, e recortado a cada execução.
     * Registrado como informação, não como problema.
     */
    recortadas: ModeloReferenciaIgnorada[];
    /** Arquivos que o modelo pediu para não entregar (`incluir: false`). */
    descartados: string[];
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
     *     Excel, escritas direto pelo sink `xlsx` da lib. Nunca recebe o guard `="..."`,
     *     então `fixFormulaStringsInXlsx` deixa de ser necessário neste caminho.
     *
     * Arquivos sem schema declarado são devolvidos intactos, para o caminho legado de `zipFiles`.
     *
     * Arquivo com schema que o modelo **não menciona** roda com o padrão daquele arquivo (todas as
     * colunas, labels e formatação do schema): um modelo que customiza uma planilha não deveria
     * fazer as outras regredirem para CSV cru de cabeçalho técnico. Para de fato não entregar um
     * arquivo existe a flag explícita `incluir: false`.
     */
    async aplicarModelo(
        files: FileOutput[],
        schemas: ReportFileSchema[],
        modelo: RelatorioModeloConfigDto,
        colunasDaFonte?: ColunasDaFonte
    ): Promise<AplicarModeloResultado> {
        const out: FileOutput[] = [];
        const ignoradas: ModeloReferenciaIgnorada[] = [];
        const recortadas: ModeloReferenciaIgnorada[] = [];
        const descartados: string[] = [];

        for (const file of files) {
            const schema = findFileSchema(schemas, file.name);
            const doModelo = modelo.arquivos.find((a) => a.arquivo === file.name);

            // Antes do teste de schema: "não quero este arquivo" vale mesmo para arquivo que o
            // pós-processamento não saberia formatar.
            if (doModelo?.incluir === false) {
                descartados.push(file.name);
                this.removerTemporario(file.localFile);
                continue;
            }

            if (!schema || !file.localFile) {
                out.push(file);
                continue;
            }

            const cfg: RelatorioModeloArquivoDto = doModelo ?? { arquivo: file.name };

            const registrar = registradorDeReferencias(
                file.name,
                colunasDaFonte?.get(file.name),
                ignoradas,
                recortadas,
                (coluna, onde) =>
                    this.logger.warn(
                        `Modelo referencia "${coluna}" em ${onde} de ${file.name}, que a fonte não declara mais.`
                    )
            );

            const colunas = resolverColunasDoModelo(schema, cfg, registrar);
            // Filtro sobre coluna ausente é descartado, não convertido para NULL: `col = 'x'`
            // com col NULL nunca é verdadeiro e devolveria um relatório vazio — pior que
            // devolver as linhas sem aquele recorte.
            const filtros = compilarFiltros(cfg.filtros ?? [], schema.colunas, (c) => registrar('filtros', c));
            const ordens = this.resolverOrdenacao(schema, cfg, registrar);

            const csvOut = tmpFile('pp-csv', '.csv');
            await this.executar(file.localFile, schema, colunas, filtros, ordens, csvOut, 'csv');
            out.push({ name: file.name, localFile: csvOut });

            const aba = nomeAba(file.name);
            const xlsxOut = tmpFile('pp-xlsx', '.xlsx');
            if (modelo.xlsx_tipado !== false) {
                // Tipado (padrão): o plano roda direto no sink xlsx, preservando DECIMAL/DATE.
                await this.executar(file.localFile, schema, colunas, filtros, ordens, xlsxOut, 'xlsx', aba);
            } else {
                // Espelhar o CSV é reler o CSV: mesma apresentação por construção, e o plano
                // não roda uma segunda vez só para virar texto.
                await this.csvParaXlsx(csvOut, xlsxOut, aba);
            }
            out.push({ name: file.name.replace(/\.csv$/, '.xlsx'), localFile: xlsxOut });

            this.removerTemporario(file.localFile);
        }

        return { arquivos: out, ignoradas, recortadas, descartados };
    }

    /** Remove o CSV bruto já consumido (ou descartado): ele não entra no zip e ninguém mais o lê. */
    private removerTemporario(localFile: string | undefined): void {
        if (!localFile) return;
        try {
            fs.unlinkSync(localFile);
        } catch (e) {
            this.logger.warn(`Falha ao remover CSV bruto ${localFile}: ${e}`);
        }
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
     *   - `csv`  → formatação completa + labels + guard de texto
     *   - `xlsx` → apenas renomeação, tipos nativos (a lib trata xlsx como parquet)
     */
    private async executar(
        csvPath: string,
        schema: ReportFileSchema,
        colunas: ReportColumnDef[],
        filtros: string[],
        ordens: RelatorioModeloOrdemDto[],
        destino: string,
        saida: 'csv' | 'xlsx',
        aba?: string
    ): Promise<number> {
        const report = new ReportWithContext()
            .duckdb({ settings: DUCKDB_SETTINGS })
            // from/until são exigidos pelo contexto da lib mas irrelevantes aqui: o
            // recorte temporal já aconteceu na extração; o CSV bruto é a fonte inteira.
            .context({ from: new Date(0), until: new Date('9999-12-31'), timezone: 'America/Sao_Paulo' })
            .load('raw', new CsvSchemaProvider(csvPath, schema));

        // No CSV, colunas com excelTextGuard viram expressão VARCHAR já envolvida em
        // `="..."`. No XLSX a coluna segue com o tipo nativo.
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
        // A lib acumula (`outputOrderBy.push`) e emite `ORDER BY a, b, ...` na ordem recebida.
        for (const o of ordens) report.orderBy(o.coluna, o.direcao);

        report.format(this.montarFormatConfig(colunas, saida));

        try {
            const res = await report.buildToFile(destino, {
                format: saida,
                header: true,
                ...(saida === 'csv' ? { delimiter: ';' } : { sheet: aba }),
            });
            return res.rowCount;
        } finally {
            await report.close();
        }
    }

    /**
     * Traduz o schema + modelo para o `FormatConfig` da lib.
     *
     * Para XLSX só o `rename` é emitido — a lib já ignora casting de tipo nesse formato,
     * mas manter a config enxuta deixa a intenção explícita.
     *
     * `label` e `dateFormat` vão **crus**: desde a 0.4.0 a lib escapa os dois (`"` dobrado
     * em `quoteIdentifier`, `'` em `escapeStringLiteral`). Escapar aqui também dobraria o
     * escape e o usuário veria `X""` onde escreveu `X"`.
     */
    private montarFormatConfig(colunas: ReportColumnDef[], saida: 'csv' | 'xlsx'): FormatConfig {
        const columns: Record<string, ColumnFormatConfig> = {};

        for (const c of colunas) {
            if (saida === 'xlsx') {
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
     * Converte um CSV **já formatado** em XLSX, tudo como texto (`all_varchar`) — é isso
     * que faz o XLSX de `xlsx_tipado: false` espelhar a apresentação do CSV.
     *
     * Fora do caminho da lib porque aqui a fonte é um arquivo pronto, não um plano: não há
     * schema para declarar nem formatação para aplicar, só um `COPY`.
     */
    private async csvParaXlsx(csv: string, destino: string, aba: string): Promise<void> {
        const instance = await DuckDBInstance.create(':memory:', DUCKDB_SETTINGS);
        const con = await instance.connect();
        try {
            // `INSTALL` antes do `LOAD` pelo mesmo motivo que a lib faz (0.5.0): o cache de
            // extensão é por versão do DuckDB (`~/.duckdb/extensions/v<versão>/`), então um
            // `LOAD` solto só funciona se aquela versão já tiver sido populada — falha em
            // máquina nova e a cada upgrade do DuckDB. `INSTALL` é idempotente e lê do cache.
            await con.run('INSTALL excel');
            await con.run('LOAD excel');
            await con.run(
                `COPY (SELECT * FROM read_csv(${sqlLit(csv)}, delim = ';', header = true, all_varchar = true)) ` +
                    `TO ${sqlLit(destino)} (FORMAT xlsx, HEADER true, SHEET ${sqlLit(aba)})`
            );
        } finally {
            con.disconnectSync();
        }
    }
}
