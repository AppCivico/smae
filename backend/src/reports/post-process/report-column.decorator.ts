import 'reflect-metadata';
import { FonteRelatorio } from '@prisma/client';
import { ReportColumnFormat, ReportColumnType, ReportFileSchema } from './report-schema';

const COLUNAS = Symbol('smae:report-colunas');
const ARQUIVO = Symbol('smae:report-arquivo');

/** Registro global de todas as classes de linha decoradas, para docgen e listagem na API. */
const REGISTRO: ReportRowClass[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReportRowClass = new (...args: any[]) => any;

export class ReportColumnOptions {
    /** Tipo DuckDB usado ao reler o CSV bruto. */
    type: ReportColumnType;
    /** Cabeçalho padrão na saída. */
    label: string;
    /** Regras de apresentação padrão. */
    format?: ReportColumnFormat;
    /**
     * Se `false`, a coluna não pode ser removida nem renomeada por um modelo.
     * Use para chaves que o consumidor do relatório depende (ex.: IDs de conciliação).
     * Default: `true`.
     */
    customizavel?: boolean;
    /** Nota explicativa — aparece na documentação gerada e na listagem da API. */
    descricao?: string;
}

export class ReportRowsOptions {
    /** Nome do arquivo produzido por `toFileOutput` (ex.: 'transferencias.csv'). */
    arquivo: string;
    /** Fontes que produzem este arquivo. Usado para a listagem por fonte na API. */
    fontes: FonteRelatorio[];
    /** Descrição do conjunto de linhas, para a documentação gerada. */
    descricao?: string;
}

/**
 * Declara uma coluna do CSV bruto de um relatório.
 *
 * A ordem de declaração na classe é a ordem padrão das colunas na saída.
 */
export function ReportColumn(options: ReportColumnOptions): PropertyDecorator {
    return (target, propertyKey) => {
        const ctor = target.constructor;
        const existentes: { propriedade: string; options: ReportColumnOptions }[] =
            Reflect.getOwnMetadata(COLUNAS, ctor) ?? [];

        existentes.push({ propriedade: String(propertyKey), options });
        Reflect.defineMetadata(COLUNAS, existentes, ctor);
    };
}

/** Marca a classe como o conjunto de linhas de um arquivo de relatório. */
export function ReportRows(options: ReportRowsOptions): ClassDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return (target: Function) => {
        Reflect.defineMetadata(ARQUIVO, options, target);
        REGISTRO.push(target as unknown as ReportRowClass);
    };
}

export function getReportRowsOptions(cls: ReportRowClass): ReportRowsOptions | undefined {
    return Reflect.getMetadata(ARQUIVO, cls);
}

/**
 * Deriva o `ReportFileSchema` a partir dos decoradores da classe.
 *
 * Inclui colunas herdadas: as classes-base são percorridas primeiro, então uma linha
 * que estende outra mantém as colunas do pai antes das próprias.
 */
export function getReportRowSchema(cls: ReportRowClass): ReportFileSchema {
    const opts = getReportRowsOptions(cls);
    if (!opts) throw new Error(`Classe ${cls.name} não está decorada com @ReportRows.`);

    return { arquivo: opts.arquivo, colunas: coletarColunas(cls).map(({ propriedade, options }) => ({
        name: propriedade,
        type: options.type,
        label: options.label,
        format: options.format,
    })) };
}

/** Metadados completos (inclui `customizavel`/`descricao`), para docgen e API. */
export function getReportRowColumns(cls: ReportRowClass): { propriedade: string; options: ReportColumnOptions }[] {
    return coletarColunas(cls);
}

function coletarColunas(cls: ReportRowClass): { propriedade: string; options: ReportColumnOptions }[] {
    const cadeia: ReportRowClass[] = [];
    let atual: ReportRowClass | null = cls;
    while (atual && atual !== Function.prototype && atual.name) {
        cadeia.unshift(atual);
        atual = Object.getPrototypeOf(atual);
    }

    const vistas = new Set<string>();
    const out: { propriedade: string; options: ReportColumnOptions }[] = [];
    for (const c of cadeia) {
        const proprias: { propriedade: string; options: ReportColumnOptions }[] =
            Reflect.getOwnMetadata(COLUNAS, c) ?? [];
        for (const col of proprias) {
            if (vistas.has(col.propriedade)) continue;
            vistas.add(col.propriedade);
            out.push(col);
        }
    }
    return out;
}

/** Todas as classes de linha registradas. A ordem segue a de carregamento dos módulos. */
export function listReportRowClasses(): ReportRowClass[] {
    return [...REGISTRO];
}

export function findReportRowClassesByFonte(fonte: FonteRelatorio): ReportRowClass[] {
    return REGISTRO.filter((c) => getReportRowsOptions(c)?.fontes.includes(fonte));
}
