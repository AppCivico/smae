import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { SmaeConfigService } from '../common/services/smae-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskableService } from '../task/entities/task.entity';
import { PreviewConfig } from './arquivo-preview.helper';
import { GotenbergService } from './gotenberg.service';
import { StorageService } from './storage-service';

@Injectable()
export class PreviewService implements TaskableService {
    private readonly logger = new Logger(PreviewService.name);
    gerar_preview_pdf: any;

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly gotenbergService: GotenbergService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    async processPreviewTask(taskId: number, params: any): Promise<void> {
        const arquivoId = params.arquivo_id;
        const tipoPreview = params.tipo_preview;

        this.gerar_preview_pdf = await this.smaeConfigService.getConfigBooleanWithDefault('GERAR_PREVIEW_PDF', true);
        this.logger.log(`Processing preview for arquivo ${arquivoId}, type: ${tipoPreview}`);

        try {
            // Update status to 'executando'
            await this.prisma.arquivo.update({
                where: { id: arquivoId },
                data: {
                    preview_status: 'executando',
                    preview_atualizado_em: new Date(),
                },
            });

            const arquivo = await this.prisma.arquivo.findUnique({
                where: { id: arquivoId },
                select: {
                    id: true,
                    caminho: true,
                    nome_original: true,
                    mime_type: true,
                    criado_por: true,
                },
            });

            if (!arquivo) {
                throw new Error('Arquivo not found');
            }

            let previewArquivoId: number;

            if (tipoPreview === 'redimensionamento') {
                previewArquivoId = await this.processImageResize(arquivo);
            } else if (tipoPreview === 'conversao_pdf') {
                previewArquivoId = await this.processPdfConversion(arquivo);
            } else if (tipoPreview === 'conversao_csv') {
                previewArquivoId = await this.processCsvConversion(arquivo);
            } else if (tipoPreview === 'conversao_json') {
                previewArquivoId = await this.processJsonConversion(arquivo);
            } else {
                throw new Error(`Unknown preview type: ${tipoPreview}`);
            }

            // Update to 'concluido'
            await this.prisma.arquivo.update({
                where: { id: arquivoId },
                data: {
                    preview_status: 'concluido',
                    preview_arquivo_id: previewArquivoId,
                    preview_atualizado_em: new Date(),
                },
            });

            this.logger.log(`Preview generated successfully for arquivo ${arquivoId}`);
        } catch (error) {
            this.logger.error(`Error generating preview for arquivo ${arquivoId}:`, error);

            const isGotenbergError = error.message?.includes('Gotenberg') || error.message?.includes('conversion');

            await this.prisma.arquivo.update({
                where: { id: arquivoId },
                data: {
                    preview_status: isGotenbergError ? 'sem_suporte' : 'erro',
                    preview_erro_mensagem: error.message || 'Unknown error',
                    preview_atualizado_em: new Date(),
                },
            });

            throw error;
        }
    }

    private async processImageResize(arquivo: any): Promise<number> {
        // Download original file
        const stream = await this.storage.getStream(arquivo.caminho);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        // Resize image
        const resizedBuffer = await sharp(buffer)
            .resize(PreviewConfig.PREVIEW_IMAGEM_LARGURA_MAX, null, {
                withoutEnlargement: true,
                fit: 'inside',
            })
            .jpeg({ quality: PreviewConfig.PREVIEW_IMAGEM_QUALIDADE })
            .toBuffer();

        // Upload preview
        const previewId = await this.uploadPreview(
            arquivo.id,
            arquivo.nome_original,
            resizedBuffer,
            'image/jpeg',
            arquivo.criado_por
        );

        return previewId;
    }

    private async processPdfConversion(arquivo: any): Promise<number> {
        this.logger.log(`Starting PDF conversion for arquivo ${arquivo.id}, mime_type: ${arquivo.mime_type}`);

        if (arquivo.mime_type === 'application/pdf' && this.gerar_preview_pdf === false) {
            this.logger.log(`File is already a PDF, skipping conversion and using original arquivo ${arquivo.id}`);
            return arquivo.id;
        }

        // Download original file from storage
        const stream = await this.storage.getStream(arquivo.caminho);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        this.logger.log(`Downloaded file buffer, size: ${buffer.length} bytes`);

        // Check if this is a multi-page document type (excludes spreadsheets like XLSX)
        const isMultiPageDocument = this.gotenbergService.isMultiPageDocumentType(arquivo.mime_type);

        // Determine page limit: Multi-page documents (DOCX, PPTX, etc.) get 5 pages, others get 1 page
        const pageLimit = isMultiPageDocument ? '1-5' : '1';

        // Convert to PDF using Gotenberg (full document first)
        let pdfBuffer = await this.gotenbergService.convertToPdf(buffer, arquivo.nome_original, arquivo.mime_type, {
            quality: 60,
            losslessImageCompression: false,
        });

        this.logger.log(`Initial conversion completed, PDF buffer size: ${pdfBuffer.length} bytes`);

        // Extract only the needed pages for preview
        this.logger.log(`Extracting pages ${pageLimit} for preview...`);
        try {
            pdfBuffer = await this.gotenbergService.extractPdfPages(pdfBuffer, pageLimit);
            this.logger.log(`Page extraction completed, final PDF buffer size: ${pdfBuffer.length} bytes`);
        } catch (error) {
            // If extraction fails (e.g., document has fewer pages than requested), use the full conversion
            this.logger.warn(`Could not extract pages, using full PDF: ${error.message}`);
        }

        // Upload preview
        const previewId = await this.uploadPreview(
            arquivo.id,
            arquivo.nome_original,
            pdfBuffer,
            'application/pdf',
            arquivo.criado_por
        );

        return previewId;
    }

    private async processCsvConversion(arquivo: any): Promise<number> {
        this.logger.log(`Starting CSV conversion for arquivo ${arquivo.id}`);

        // Download original CSV file from storage
        const stream = await this.storage.getStream(arquivo.caminho);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        this.logger.log(`Downloaded CSV file buffer, size: ${buffer.length} bytes`);

        try {
            // Parse CSV
            const csvContent = buffer.toString('utf-8');
            const htmlContent = this.createCsvHtml(csvContent, arquivo.nome_original, 30); // ~30 rows fit on one page

            // Convert to PDF using Gotenberg
            const pdfBuffer = await this.gotenbergService.convertHtmlToPdf(htmlContent, {
                printBackground: true,
                marginTop: 0.3,
                marginBottom: 0.3,
                marginLeft: 0.3,
                marginRight: 0.3,
            });

            this.logger.log(`CSV conversion completed, PDF buffer size: ${pdfBuffer.length} bytes`);

            // Upload preview
            const previewId = await this.uploadPreview(
                arquivo.id,
                arquivo.nome_original,
                pdfBuffer,
                'application/pdf',
                arquivo.criado_por
            );

            return previewId;
        } catch (error) {
            this.logger.error(`Error parsing or converting CSV for arquivo ${arquivo.id}:`, error);
            throw new Error(`CSV conversion failed: ${error.message}`);
        }
    }

    private async processJsonConversion(arquivo: any): Promise<number> {
        this.logger.log(`Starting JSON conversion for arquivo ${arquivo.id}`);

        // Download original JSON file from storage
        const stream = await this.storage.getStream(arquivo.caminho);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        this.logger.log(`Downloaded JSON file buffer, size: ${buffer.length} bytes`);

        try {
            // Parse and format JSON
            const jsonString = buffer.toString('utf-8');
            const jsonObject = JSON.parse(jsonString);
            const formattedJson = JSON.stringify(jsonObject, null, 2);

            // Truncate to fit one page (approximately 50 lines)
            const truncatedJson = this.truncateJsonForPreview(formattedJson, 50);

            // Create HTML with syntax highlighting
            const htmlContent = this.createJsonHtml(
                truncatedJson.content,
                arquivo.nome_original,
                truncatedJson.wasTruncated
            );

            // Convert to PDF using Gotenberg
            const pdfBuffer = await this.gotenbergService.convertHtmlToPdf(htmlContent, {
                printBackground: true,
                marginTop: 0.5,
                marginBottom: 0.5,
                marginLeft: 0.5,
                marginRight: 0.5,
            });

            this.logger.log(`JSON conversion completed, PDF buffer size: ${pdfBuffer.length} bytes`);

            // Upload preview
            const previewId = await this.uploadPreview(
                arquivo.id,
                arquivo.nome_original,
                pdfBuffer,
                'application/pdf',
                arquivo.criado_por
            );

            return previewId;
        } catch (error) {
            this.logger.error(`Error parsing or converting JSON for arquivo ${arquivo.id}:`, error);
            throw new Error(`JSON conversion failed: ${error.message}`);
        }
    }

    private async processTxtConversion(arquivo: any): Promise<number> {
        this.logger.log(`Starting TXT conversion for arquivo ${arquivo.id}`);

        // Download original TXT file from storage
        const stream = await this.storage.getStream(arquivo.caminho);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        this.logger.log(`Downloaded TXT file buffer, size: ${buffer.length} bytes`);

        try {
            // Read text content
            const textContent = buffer.toString('utf-8');

            // Truncate to fit one page (approximately 50 lines)
            const truncatedText = this.truncateTxtForPreview(textContent, 50);

            // Create HTML
            const htmlContent = this.createTxtHtml(
                truncatedText.content,
                arquivo.nome_original,
                truncatedText.wasTruncated
            );

            // Convert to PDF using Gotenberg
            const pdfBuffer = await this.gotenbergService.convertHtmlToPdf(htmlContent, {
                printBackground: true,
                marginTop: 0.5,
                marginBottom: 0.5,
                marginLeft: 0.5,
                marginRight: 0.5,
            });

            this.logger.log(`TXT conversion completed, PDF buffer size: ${pdfBuffer.length} bytes`);

            // Upload preview
            const previewId = await this.uploadPreview(
                arquivo.id,
                arquivo.nome_original,
                pdfBuffer,
                'application/pdf',
                arquivo.criado_por
            );

            return previewId;
        } catch (error) {
            this.logger.error(`Error converting TXT for arquivo ${arquivo.id}:`, error);
            throw new Error(`TXT conversion failed: ${error.message}`);
        }
    }

    private createCsvHtml(csvContent: string, filename: string, maxRows: number): string {
        const lines = csvContent.split('\n').filter((line) => line.trim());
        const isTruncated = lines.length > maxRows;
        const displayLines = isTruncated ? lines.slice(0, maxRows) : lines;

        // Parse CSV rows
        const rows = displayLines.map((line) => {
            // Simple CSV parsing (handles quoted fields)
            const fields: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    fields.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            fields.push(current.trim());
            return fields;
        });

        // Build HTML table
        const tableRows = rows
            .map((fields, index) => {
                const tag = index === 0 ? 'th' : 'td';
                const cells = fields
                    .map((field) => `<${tag}>${this.escapeHtml(field.replace(/^"|"$/g, ''))}</${tag}>`)
                    .join('');
                return `<tr>${cells}</tr>`;
            })
            .join('\n');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 10px;
                        font-size: 9px;
                    }
                    .filename {
                        font-weight: bold;
                        margin-bottom: 5px;
                        font-size: 11px;
                    }
                    .truncated-notice {
                        color: #d32f2f;
                        font-style: italic;
                        margin-bottom: 5px;
                        font-size: 9px;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        font-size: 8px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 3px 5px;
                        text-align: left;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 150px;
                    }
                    th {
                        background-color: #f5f5f5;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #fafafa;
                    }
                </style>
            </head>
            <body>
                <div class="filename">${this.escapeHtml(filename)}</div>
                <table>
                    ${tableRows}
                </table>
            </body>
            </html>
        `;
    }

    private truncateCsvForPreview(csvContent: string, maxRows: number): string {
        const lines = csvContent.split('\n');

        if (lines.length <= maxRows) {
            return csvContent;
        }

        // Keep header and first N-1 rows, then add a truncation notice
        const truncatedLines = lines.slice(0, maxRows);
        truncatedLines.push(`"... ${lines.length - maxRows} more rows (truncated for preview) ..."`);
        return truncatedLines.join('\n');
    }

    private truncateJsonForPreview(jsonString: string, maxLines: number): { content: string; wasTruncated: boolean } {
        const lines = jsonString.split('\n');

        if (lines.length <= maxLines) {
            return { content: jsonString, wasTruncated: false };
        }

        // Take first maxLines and try to close JSON properly
        const truncatedLines = lines.slice(0, maxLines);

        // Add ellipsis comment
        truncatedLines.push('  // ... (content truncated for preview)');

        // Count opening braces/brackets to try to close properly
        const content = truncatedLines.join('\n');
        const openBraces = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
        const openBrackets = (content.match(/\[/g) || []).length - (content.match(/\]/g) || []).length;

        // Add closing braces/brackets
        let closingChars = '';
        for (let i = 0; i < openBrackets; i++) closingChars += ']';
        for (let i = 0; i < openBraces; i++) closingChars += '}';

        return {
            content: content + (closingChars ? '\n' + closingChars : ''),
            wasTruncated: true,
        };
    }

    private createJsonHtml(jsonString: string, filename: string, wasTruncated: boolean = false): string {
        // Escape HTML and add syntax highlighting
        const highlighted = this.syntaxHighlightJson(jsonString);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        background: #1e1e1e;
                        color: #d4d4d4;
                        padding: 20px;
                        margin: 0;
                    }
                    .filename {
                        color: #4ec9b0;
                        margin-bottom: 10px;
                        font-size: 14px;
                    }
                    pre {
                        margin: 0;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    .json-key { color: #9cdcfe; }
                    .json-string { color: #ce9178; }
                    .json-number { color: #b5cea8; }
                    .json-boolean { color: #569cd6; }
                    .json-null { color: #569cd6; }
                </style>
            </head>
            <body>
                <div class="filename">${this.escapeHtml(filename)}</div>
                <pre>${highlighted}</pre>
            </body>
            </html>
        `;
    }

    private syntaxHighlightJson(json: string): string {
        json = this.escapeHtml(json);
        json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
            let cls = 'json-string';
            if (/:$/.test(match)) {
                cls = 'json-key';
            }
            return `<span class="${cls}">${match}</span>`;
        });
        json = json.replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>');
        json = json.replace(/\bnull\b/g, '<span class="json-null">null</span>');
        json = json.replace(/\b-?\d+\.?\d*\b/g, '<span class="json-number">$&</span>');
        return json;
    }

    private truncateTxtForPreview(textContent: string, maxLines: number): { content: string; wasTruncated: boolean } {
        const lines = textContent.split('\n');

        if (lines.length <= maxLines) {
            return { content: textContent, wasTruncated: false };
        }

        // Take first maxLines
        const truncatedLines = lines.slice(0, maxLines);

        return {
            content: truncatedLines.join('\n'),
            wasTruncated: true,
        };
    }

    private createTxtHtml(textContent: string, filename: string, wasTruncated: boolean = false): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        background: #ffffff;
                        color: #000000;
                        padding: 20px;
                        margin: 0;
                    }
                    .filename {
                        font-weight: bold;
                        margin-bottom: 10px;
                        font-size: 14px;
                        color: #333333;
                    }
                    .truncated-notice {
                        color: #d32f2f;
                        font-style: italic;
                        margin-bottom: 10px;
                        font-size: 12px;
                    }
                    pre {
                        margin: 0;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                </style>
            </head>
            <body>
                <div class="filename">${this.escapeHtml(filename)}</div>
                ${wasTruncated ? '<div class="truncated-notice">⚠ Conteúdo truncado para preview</div>' : ''}
                <pre>${this.escapeHtml(textContent)}</pre>
            </body>
            </html>
        `;
    }

    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    private async uploadPreview(
        originalArquivoId: number,
        originalFilename: string,
        buffer: Buffer,
        mimeType: string,
        userId: number | null
    ): Promise<number> {
        const arquivoId = await this.nextSequence();

        // Remove original extension and add appropriate extension based on output mimeType
        const extension = this.getExtensionFromMimeType(mimeType);
        const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
        const previewFilename = `preview-${filenameWithoutExt}${extension}`;

        const key = [
            'uploads',
            'preview_documento',
            'original-arquivo-id',
            String(originalArquivoId),
            new Date(Date.now()).toISOString(),
            'arquivo-id-' + String(arquivoId),
            previewFilename.replace(/\s/g, '-').replace(/[^\w-\\.0-9_]*/gi, ''),
        ].join('/');

        await this.storage.putBlob(key, buffer, {
            'Content-Type': mimeType,
            'x-user-id': userId || 'sistema',
            'x-tipo': 'PREVIEW_DOCUMENTO',
            'x-original-arquivo-id': String(originalArquivoId),
        });

        await this.prisma.arquivo.create({
            data: {
                id: arquivoId,
                criado_por: userId,
                criado_em: new Date(),
                caminho: key,
                nome_original: previewFilename,
                mime_type: mimeType,
                tamanho_bytes: buffer.length,
                tipo: 'PREVIEW_DOCUMENTO',
            },
        });

        return arquivoId;
    }

    /**
     * Get file extension from MIME type
     * @param mimeType The MIME type
     * @returns The file extension including the dot
     */
    private getExtensionFromMimeType(mimeType: string): string {
        const mimeToExt: Record<string, string> = {
            // Images
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'image/bmp': '.bmp',
            'image/tiff': '.tiff',
            // Documents
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            'application/vnd.oasis.opendocument.text': '.odt',
            'application/vnd.oasis.opendocument.spreadsheet': '.ods',
            'application/vnd.oasis.opendocument.presentation': '.odp',
            // Text
            'text/plain': '.txt',
            'text/csv': '.csv',
            'text/html': '.html',
            'text/rtf': '.rtf',
            'application/rtf': '.rtf',
            // Other
            'application/zip': '.zip',
            'application/json': '.json',
            'application/xml': '.xml',
        };

        return mimeToExt[mimeType] || '.bin';
    }

    private async nextSequence(): Promise<number> {
        const nextVal: any[] = await this.prisma.$queryRaw`select nextval('arquivo_id_seq'::regclass) as id`;
        return Number(nextVal[0].id);
    }

    /**
     * TaskableService implementation - execute the preview generation job
     */
    async executeJob(params: any, jobId: string): Promise<any> {
        const arquivoId = params.arquivo_id;
        const tipoPreview = params.tipo_preview;

        this.logger.log(`[Job ${jobId}] Processing preview for arquivo ${arquivoId}, type: ${tipoPreview}`);

        try {
            // Update status to 'executando'
            await this.prisma.arquivo.update({
                where: { id: arquivoId },
                data: {
                    preview_status: 'executando',
                    preview_atualizado_em: new Date(),
                },
            });

            const arquivo = await this.prisma.arquivo.findUnique({
                where: { id: arquivoId },
                select: {
                    id: true,
                    caminho: true,
                    nome_original: true,
                    mime_type: true,
                    criado_por: true,
                },
            });

            if (!arquivo) {
                throw new Error('Arquivo not found');
            }

            let previewArquivoId: number;

            if (tipoPreview === 'redimensionamento') {
                previewArquivoId = await this.processImageResize(arquivo);
            } else if (tipoPreview === 'conversao_pdf') {
                previewArquivoId = await this.processPdfConversion(arquivo);
            } else if (tipoPreview === 'conversao_csv') {
                previewArquivoId = await this.processCsvConversion(arquivo);
            } else if (tipoPreview === 'conversao_json') {
                previewArquivoId = await this.processJsonConversion(arquivo);
            } else if (tipoPreview === 'conversao_txt') {
                previewArquivoId = await this.processTxtConversion(arquivo);
            } else {
                throw new Error(`Unknown preview type: ${tipoPreview}`);
            }

            // Update to 'concluido'
            await this.prisma.arquivo.update({
                where: { id: arquivoId },
                data: {
                    preview_status: 'concluido',
                    preview_arquivo_id: previewArquivoId,
                    preview_atualizado_em: new Date(),
                },
            });

            this.logger.log(`[Job ${jobId}] Preview generated successfully for arquivo ${arquivoId}`);

            return {
                success: true,
                arquivo_id: arquivoId,
                preview_arquivo_id: previewArquivoId,
                tipo_preview: tipoPreview,
            };
        } catch (error) {
            this.logger.error(`[Job ${jobId}] Error generating preview for arquivo ${arquivoId}:`, error);

            const isGotenbergError = error.message?.includes('Gotenberg') || error.message?.includes('conversion');

            await this.prisma.arquivo.update({
                where: { id: arquivoId },
                data: {
                    preview_status: isGotenbergError ? 'sem_suporte' : 'erro',
                    preview_erro_mensagem: error.message || 'Unknown error',
                    preview_atualizado_em: new Date(),
                },
            });

            throw error;
        }
    }

    /**
     * TaskableService implementation - convert job output to JSON
     */
    outputToJson(executeOutput: any, _inputParams: any, _jobId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
