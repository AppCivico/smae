import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Parser } from '@json2csv/plainjs';
import { flatten } from '@json2csv/transforms';
import { StreamBatchHandler } from './stream-handlers';

/** O `transforms` do json2csv é uma tupla, não um array qualquer — mesma forma que o `Parser` exige. */
export type CsvTransforms = NonNullable<ConstructorParameters<typeof Parser<any, any>>[0]>['transforms'];

export const DefaultCsvTransforms = [
    flatten({
        arrays: true,
        objects: true,
        separator: '.',
    }),
] satisfies CsvTransforms;

/**
 * Terminador de linha do arquivo inteiro — cabeçalho, linhas dentro de um lote e fim de lote.
 *
 * Precisa ser explícito porque o eol padrão do json2csv é `\n`, e o cabeçalho/fim de lote daqui
 * sempre foram `\r\n`: o arquivo saía com CRLF no cabeçalho e no fim de cada lote, e LF entre as
 * linhas do mesmo lote. Ninguém relia esses arquivos, então a mistura passou despercebida; com o
 * pós-processamento o DuckDB relê o CSV, e o sniffer do `read_csv` falha
 * (`Error when sniffing file`) quando a amostra pega os dois terminadores. Como o sniffer amostra
 * só as primeiras linhas, a falha era **intermitente** e dependente do volume de dados.
 *
 * `\r\n` (e não `\n`) para acompanhar o `DefaultCsvOptions` do resto do projeto — e porque é o
 * que o cabeçalho já usava, então a mudança de bytes fica restrita às linhas de dados.
 */
const EOL = '\r\n';

export class CsvFileHandler implements StreamBatchHandler<any> {
    private parser: Parser<any, any>;
    private tmpFilePath: string;
    private fileHandle: fs.promises.FileHandle | null = null;
    private fileWritten = false;

    /**
     * @param fields chaves lidas de cada linha, na ordem das colunas
     * @param fieldNames cabeçalho escrito no arquivo (uma entrada por `fields`)
     * @param transforms transforms do json2csv. O padrão achata objetos **e** arrays com `.`;
     *   relatórios com schema declarado passam um flatten com separador `__`, porque o builder
     *   DuckDB trata `.` como referência qualificada por fonte.
     */
    constructor(
        private fields: string[],
        private fieldNames: string[],
        transforms: CsvTransforms = DefaultCsvTransforms
    ) {
        this.parser = new Parser<any, any>({
            fields: this.fields,
            header: false,
            transforms,
            eol: EOL,
        });

        // Cria um caminho para o arquivo temporário
        this.tmpFilePath = path.join(os.tmpdir(), `csv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.tmp`);
    }

    async onBatch(batch: any[], batchIndex: number, totalBatches: number): Promise<void> {
        if (batch.length === 0) return;

        try {
            if (!this.fileHandle) {
                this.fileHandle = await fs.promises.open(this.tmpFilePath, 'w');

                const headerLine = this.fieldNames.map((name) => `"${name}"`).join(',') + EOL;
                await this.fileHandle.write(headerLine);
            }

            this.fileWritten = true;

            // Converte o lote de dados (JSON) para o formato CSV.
            // `parse` junta as linhas do lote com `EOL` e **não** termina o último — daí o `+ EOL`,
            // que fecha a última linha do lote sem gerar quebra dupla entre lotes nem linha em
            // branco no fim do arquivo.
            const csvChunk = this.parser.parse(batch) + EOL;

            // Escreve o chunk de CSV no arquivo
            await this.fileHandle.write(csvChunk);
        } catch (error) {
            if (this.fileHandle) {
                await this.fileHandle.close().catch(() => {});
                this.fileHandle = null;
            }
            throw error;
        }
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
