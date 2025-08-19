import { Parser } from '@json2csv/plainjs';
import { Readable, Transform } from 'stream';

export interface CsvWriterOptions<T> {
    csvOptions?: {
        excelStrings?: boolean;
        eol?: string;
        withBOM?: boolean;
    };
    transforms?: any;
    fields?: any;
}

// Helper function to create a CSV writing stream
function createCsvStream<T>(options: CsvWriterOptions<T>): Transform {
    let headerWritten = false; // Track header

    return new Transform({
        objectMode: true,
        transform(chunk: T, encoding, callback) {
            try {
                const csvLine = new Parser({
                    header: !headerWritten, // Write header only once
                    ...options.csvOptions,
                    transforms: options.transforms,
                    fields: options.fields,
                }).parse([chunk]);

                headerWritten = true; // Mark header as written
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
