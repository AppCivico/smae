import { Parser } from '@json2csv/plainjs';
import { Readable, Transform } from 'stream';
import * as XLSX from 'xlsx';

export interface CsvWriterOptions<T> {
    csvOptions?: {
        excelStrings?: boolean;
        eol?: string;
        withBOM?: boolean;
    };
    transforms?: any;
    fields?: any;
}

// --- XLSX direct writer ---

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((cur: any, key: string) => (cur != null ? cur[key] : undefined), obj);
}

function getFieldValueForXlsx(row: any, field: any): any {
    if (typeof field === 'string') return getNestedValue(row, field);
    if (typeof field.value === 'function') return field.value(row);
    if (typeof field.value === 'string') {
        const direct = (row as any)[field.value];
        if (direct !== undefined) return direct;
        return getNestedValue(row, field.value);
    }
    return undefined;
}

function getFieldLabel(field: any): string {
    if (typeof field === 'string') return field;
    if (field.label != null) return String(field.label);
    if (typeof field.value === 'string') return field.value;
    return '';
}

/**
 * Converte um valor JavaScript em uma célula XLSX com o tipo correto.
 *
 * Trata o padrão ="valor" (usado historicamente para forçar texto no CSV/Excel)
 * extraindo o conteúdo interno e armazenando como string pura, eliminando a
 * exibição de fórmula no Excel.
 */
function toXlsxCell(value: any): XLSX.CellObject {
    if (value === null || value === undefined) return { v: '', t: 's' };

    if (typeof value === 'string') {
        // Strip ="..." Excel formula-string workaround → plain text cell
        const m = value.match(/^="([\s\S]*)"$/);
        if (m) return { v: m[1].replace(/""/g, '"'), t: 's' };
        return { v: value, t: 's' };
    }
    if (typeof value === 'number') return { v: value, t: 'n' };
    if (typeof value === 'boolean') return { v: value, t: 'b' };
    if (value instanceof Date) return { v: value, t: 'd' };
    return { v: String(value), t: 's' };
}

/**
 * Gera um Buffer XLSX diretamente a partir de um array de objetos e definições
 * de campos (mesmo formato aceito por WriteCsvToFile).
 */
export function WriteXlsxToBuffer<T>(data: T[], options: CsvWriterOptions<T>): Buffer {
    const fields: any[] | undefined = options.fields;
    const ws: XLSX.WorkSheet = {};
    let maxRow = 0;
    let maxCol = 0;

    const writeCell = (r: number, c: number, cell: XLSX.CellObject) => {
        ws[XLSX.utils.encode_cell({ r, c })] = cell;
        if (r > maxRow) maxRow = r;
        if (c > maxCol) maxCol = c;
    };

    if (fields && fields.length > 0) {
        // Header row
        fields.forEach((f, c) => writeCell(0, c, { v: getFieldLabel(f), t: 's' }));
        maxCol = fields.length - 1;

        // Data rows
        data.forEach((row, i) => {
            const r = i + 1;
            fields.forEach((f, c) => writeCell(r, c, toXlsxCell(getFieldValueForXlsx(row, f))));
        });
    } else {
        // No field definitions: use object keys as headers
        const keys = data.length > 0 ? Object.keys(data[0] as any) : [];
        keys.forEach((k, c) => writeCell(0, c, { v: k, t: 's' }));
        if (keys.length > 0) maxCol = keys.length - 1;

        data.forEach((row, i) => {
            const r = i + 1;
            keys.forEach((k, c) => writeCell(r, c, toXlsxCell((row as any)[k])));
        });
    }

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', bookSST: false, compression: true });
}

/**
 * Escreve um arquivo XLSX diretamente em um WriteStream.
 * Substitui WriteCsvToFile com geração nativa de XLSX.
 */
export async function WriteXlsxToFile<T>(
    data: T[],
    outputStream: NodeJS.WritableStream,
    options: CsvWriterOptions<T>
): Promise<void> {
    const buf = WriteXlsxToBuffer(data, options);
    return new Promise<void>((resolve, reject) => {
        outputStream.write(buf, (err) => {
            if (err) return reject(err);
            outputStream.end(() => resolve());
        });
    });
}

// --- Legacy CSV stream (kept para retrocompatibilidade interna) ---

function createCsvStream<T>(options: CsvWriterOptions<T>): Transform {
    let headerWritten = false;

    return new Transform({
        objectMode: true,
        transform(chunk: T, encoding, callback) {
            try {
                const csvLine = new Parser({
                    header: !headerWritten,
                    ...options.csvOptions,
                    transforms: options.transforms,
                    fields: options.fields,
                }).parse([chunk]);

                headerWritten = true;
                callback(null, csvLine + (options.csvOptions?.eol || '\n'));
            } catch (err) {
                callback(err);
            }
        },
    });
}

// Helper function to write data to the CSV stream and handle completion
export async function WriteCsvToFile<T>(
    data: T[],
    outputStream: NodeJS.WritableStream,
    options: CsvWriterOptions<T>
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const readableStream = new Readable({ objectMode: true });

        readableStream.pipe(createCsvStream(options)).pipe(outputStream).on('finish', resolve).on('error', reject);

        for (const record of data) {
            readableStream.push(record);
        }
        readableStream.push(null);
    });
}

export function WriteCsvToBuffer<T>(data: T[], options: CsvWriterOptions<T>): Buffer {
    const parser = new Parser({
        header: true,
        ...options.csvOptions,
        transforms: options.transforms,
        fields: options.fields,
    });
    const csv = parser.parse(data);
    return Buffer.from(csv, 'utf8');
}
