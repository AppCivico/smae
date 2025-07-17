import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Parser } from '@json2csv/plainjs';
import { flatten, Transform } from '@json2csv/transforms';
import { StreamBatchHandler } from './stream-handlers';

export const DefaultCsvTransforms = [
    flatten({
        arrays: true,
        objects: true,
        separator: '.',
    }),
] satisfies [Transform<any, any>, ...Transform<any, any>[]];

export class CsvFileHandler implements StreamBatchHandler<any> {
    private parser: Parser<any, any>;
    private tmpFilePath: string;
    private fileHandle: fs.promises.FileHandle | null = null;
    private fileWritten = false;

    constructor(
        private fields: string[],
        private fieldNames: string[]
    ) {
        this.parser = new Parser<any, any>({
            fields: this.fields,
            header: false,
            transforms: DefaultCsvTransforms,
        });

        // Cria um caminho para o arquivo temporário
        this.tmpFilePath = path.join(os.tmpdir(), `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.tmp`);
    }

    async onBatch(batch: any[]): Promise<void> {
        if (batch.length === 0) return;

        // Abre o arquivo para escrita no primeiro lote
        if (!this.fileHandle) {
            this.fileHandle = await fs.promises.open(this.tmpFilePath, 'w');

            // Escreve o cabeçalho manualmente para garantir a ordem e os nomes corretos
            const headerLine = this.fieldNames.map((name) => `"${name}"`).join(',') + '\r\n';
            await this.fileHandle.write(headerLine);
        }

        this.fileWritten = true;

        // Converte o lote de dados (JSON) para o formato CSV
        const csvChunk = this.parser.parse(batch) + '\r\n';

        // Escreve o chunk de CSV no arquivo
        await this.fileHandle.write(csvChunk);
    }

    async onComplete(): Promise<string | undefined> {
        if (this.fileHandle) {
            await this.fileHandle.close();
        }

        if (!this.fileWritten) {
            return undefined;
        }
        // Retorna o caminho do arquivo temporário gerado
        return this.tmpFilePath;
    }
}
