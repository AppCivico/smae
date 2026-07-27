/**
 * Schema declarativo de colunas de relatório.
 *
 * O objetivo é separar duas responsabilidades que hoje estão misturadas dentro de
 * cada `toFileOutput`:
 *
 *   1. **Extração** — produzir as linhas o mais próximo possível do "compute store":
 *      números como números, datas em ISO, sem máscara de moeda e sem o hack `="valor"`.
 *   2. **Apresentação** — selecionar/reordenar/renomear colunas, filtrar, ordenar e
 *      aplicar formatação de locale.
 *
 * Com o schema declarado, o CSV bruto gerado na etapa 1 pode ser relido no DuckDB com
 * tipos explícitos (`read_csv(..., columns={...})` em vez de `read_csv_auto`), o que
 * permite fazer a etapa 2 em SQL e emitir CSV + XLSX a partir da mesma tabela tipada.
 */

/** Tipos DuckDB suportados na declaração de schema. */
export type ReportColumnType =
    | 'VARCHAR'
    | 'BIGINT'
    | 'INTEGER'
    | 'DOUBLE'
    | 'DECIMAL(18,2)'
    | 'DECIMAL(18,4)'
    | 'DATE'
    | 'TIMESTAMP'
    | 'BOOLEAN';

/** Como uma coluna deve ser apresentada na saída de texto (CSV). */
export class ReportColumnFormat {
    /** Casas decimais para colunas numéricas. */
    decimalPlaces?: number;
    /** Prefixo de moeda (ex.: 'R$'). */
    currency?: string;
    /** Sufixo de unidade (ex.: '%', 'm³'). */
    unit?: string;
    /** Formato strftime do DuckDB. Sobrescreve o padrão do locale. */
    dateFormat?: string;
    /** Não formatar (útil para IDs numéricos). */
    raw?: boolean;
    /**
     * Envolve o valor em `="..."` **apenas no CSV**.
     *
     * Necessário porque o CSV não carrega schema: ao abrir o arquivo direto no Excel,
     * valores como `0001.02` (dotação) ou `2024.10.15.3350` seriam reinterpretados como
     * número/data. No XLSX isso é desnecessário — lá a célula já nasce VARCHAR, então
     * o guard nunca é aplicado no caminho do XLSX.
     */
    excelTextGuard?: boolean;
}

export class ReportColumnDef {
    /** Nome da coluna no CSV bruto. Sem pontos — use `__` para aninhamento. */
    name: string;
    /** Tipo DuckDB usado na releitura do CSV. */
    type: ReportColumnType;
    /** Cabeçalho padrão na saída (pode ser sobrescrito pelo modelo). */
    label: string;
    /** Regras de apresentação padrão (podem ser sobrescritas pelo modelo). */
    format?: ReportColumnFormat;
    /**
     * Coluna que o modelo pede mas que o schema atual não tem mais — sai como NULL.
     *
     * Não vem de `@ReportColumn`: é sintetizada no pós-processamento para que um modelo
     * salvo antes de a coluna ser removida continue gerando relatório. `name` nesse caso é
     * um identificador gerado (nunca o nome vindo do modelo), justamente para não colocar
     * entrada de usuário na posição de identificador SQL.
     */
    ausente?: boolean;
}

export class ReportFileSchema {
    /** Nome do arquivo produzido por `toFileOutput` (ex.: 'transferencias.csv'). */
    arquivo: string;
    colunas: ReportColumnDef[];
}

/**
 * Implementado pelos serviços de relatório que emitem CSV bruto + schema, habilitando
 * o pós-processamento. Opcional: serviços sem `describeSchema` seguem no caminho legado.
 */
export interface SchemaAwareReportableService {
    describeSchema(params: any): Promise<ReportFileSchema[]>;
}

export function isSchemaAware(svc: unknown): svc is SchemaAwareReportableService {
    return typeof (svc as SchemaAwareReportableService)?.describeSchema === 'function';
}

export function findFileSchema(schemas: ReportFileSchema[], arquivo: string): ReportFileSchema | undefined {
    return schemas.find((s) => s.arquivo === arquivo);
}
