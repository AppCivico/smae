import { Injectable, Logger } from '@nestjs/common';
import * as FormData from 'form-data';
import got from 'got';
import { Readable } from 'stream';

export interface GotenbergConversionOptions {
    /**
     * Set the paper orientation to landscape
     */
    landscape?: boolean;

    /**
     * Page ranges to print, e.g., '1-5'
     */
    nativePageRanges?: string;

    /**
     * Convert the resulting PDF into the given PDF/A format
     * Available formats: PDF/A-1b, PDF/A-2b, PDF/A-3b
     */
    pdfa?: 'PDF/A-1b' | 'PDF/A-2b' | 'PDF/A-3b';

    /**
     * Enable PDF for Universal Access for optimal accessibility
     */
    pdfua?: boolean;

    /**
     * Merge resulting PDFs (when multiple files)
     */
    merge?: boolean;

    /**
     * The quality of the JPG export (1-100)
     */
    quality?: number;

    /**
     * Specify if images are exported to PDF using lossless compression
     */
    losslessImageCompression?: boolean;
}

@Injectable()
export class GotenbergService {
    private readonly logger = new Logger(GotenbergService.name);
    private readonly gotenbergUrl: string;

    constructor() {
        // Get Gotenberg URL from environment variable or use default
        this.gotenbergUrl = process.env.GOTENBERG_URL || 'http://gotenberg:3000';
    }

    /**
     * Convert an Office document to PDF using Gotenberg's LibreOffice route
     * @param fileBuffer The file content as Buffer
     * @param filename The original filename (with extension)
     * @param mimeType The MIME type of the file
     * @param options Conversion options
     * @returns Promise<Buffer> The converted PDF as Buffer
     */
    async convertToPdf(
        fileBuffer: Buffer,
        filename: string,
        mimeType: string,
        options: GotenbergConversionOptions = {}
    ): Promise<Buffer> {
        this.logger.log(`Converting file "${filename}" (${mimeType}) to PDF using Gotenberg`);
        try {
            // Determine which route to use based on mime type
            const route = this.getRouteForMimeType(mimeType);

            if (!route) {
                this.logger.log(`File "${filename}" is already a PDF, skipping conversion`);
                return fileBuffer;
            }

            const url = `${this.gotenbergUrl}${route}`;
            console.log(url);

            // Create form data
            const formData = new FormData();

            // Add the file to convert
            formData.append('files', fileBuffer, {
                filename: filename,
                contentType: mimeType,
            });

            console.log('===================');
            console.log(formData);
            console.log(filename);
            console.log(mimeType);
            console.log('===================');

            // Add optional parameters
            if (options.landscape !== undefined) {
                formData.append('landscape', String(options.landscape));
            }

            if (options.nativePageRanges) {
                formData.append('nativePageRanges', options.nativePageRanges);
            }

            if (options.pdfa) {
                formData.append('pdfa', options.pdfa);
            }

            if (options.pdfua !== undefined) {
                formData.append('pdfua', String(options.pdfua));
            }

            if (options.merge !== undefined) {
                formData.append('merge', String(options.merge));
            }

            if (options.quality !== undefined) {
                formData.append('quality', String(options.quality));
            }

            if (options.losslessImageCompression !== undefined) {
                formData.append('losslessImageCompression', String(options.losslessImageCompression));
            }

            // Make the request to Gotenberg
            const response = await got.post(url, {
                body: formData,
                responseType: 'buffer',
            });

            const pdfBuffer = response.body;

            this.logger.log(`Successfully converted "${filename}" to PDF (${pdfBuffer.length} bytes)`);

            return pdfBuffer;
        } catch (error) {
            this.logger.error(`Error converting file "${filename}" to PDF:`, error);

            if (error.response) {
                const errorText = error.response.body?.toString() || error.message;
                throw new Error(`Gotenberg conversion failed with status ${error.response.statusCode}: ${errorText}`);
            }

            throw new Error(`Gotenberg conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert HTML content to PDF using Gotenberg's Chromium route
     * @param htmlContent The HTML content as string
     * @param options Conversion options
     * @returns Promise<Buffer> The converted PDF as Buffer
     */
    async convertHtmlToPdf(
        htmlContent: string,
        options: {
            paperWidth?: number;
            paperHeight?: number;
            marginTop?: number;
            marginBottom?: number;
            marginLeft?: number;
            marginRight?: number;
            landscape?: boolean;
            printBackground?: boolean;
            pdfa?: 'PDF/A-1b' | 'PDF/A-2b' | 'PDF/A-3b';
        } = {}
    ): Promise<Buffer> {
        this.logger.log('Converting HTML to PDF using Gotenberg');

        try {
            const url = `${this.gotenbergUrl}/forms/chromium/convert/html`;

            const formData = new FormData();

            // Add HTML content
            formData.append('files', Buffer.from(htmlContent), {
                filename: 'index.html',
                contentType: 'text/html',
            });

            // Add optional parameters
            if (options.paperWidth !== undefined) {
                formData.append('paperWidth', String(options.paperWidth));
            }

            if (options.paperHeight !== undefined) {
                formData.append('paperHeight', String(options.paperHeight));
            }

            if (options.marginTop !== undefined) {
                formData.append('marginTop', String(options.marginTop));
            }

            if (options.marginBottom !== undefined) {
                formData.append('marginBottom', String(options.marginBottom));
            }

            if (options.marginLeft !== undefined) {
                formData.append('marginLeft', String(options.marginLeft));
            }

            if (options.marginRight !== undefined) {
                formData.append('marginRight', String(options.marginRight));
            }

            if (options.landscape !== undefined) {
                formData.append('landscape', String(options.landscape));
            }

            if (options.printBackground !== undefined) {
                formData.append('printBackground', String(options.printBackground));
            }

            if (options.pdfa) {
                formData.append('pdfa', options.pdfa);
            }

            // Make the request
            const response = await got.post(url, {
                body: formData,
                responseType: 'buffer',
            });

            const pdfBuffer = response.body;

            this.logger.log(`Successfully converted HTML to PDF (${pdfBuffer.length} bytes)`);

            return pdfBuffer;
        } catch (error) {
            this.logger.error('Error converting HTML to PDF:', error);

            if (error.response) {
                const errorText = error.response.body?.toString() || error.message;
                throw new Error(
                    `Gotenberg HTML conversion failed with status ${error.response.statusCode}: ${errorText}`
                );
            }

            throw new Error(`Gotenberg HTML conversion failed: ${error.message}`);
        }
    }

    /**
     * Check if Gotenberg service is healthy
     * @returns Promise<boolean>
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await got.get(`${this.gotenbergUrl}/health`, {
                responseType: 'json',
            });

            return response.statusCode === 200;
        } catch (error) {
            this.logger.warn('Gotenberg health check failed:', error);
            return false;
        }
    }

    /**
     * Get the appropriate Gotenberg route based on MIME type
     * @param mimeType The MIME type
     * @returns The route path or null if unsupported
     */
    private getRouteForMimeType(mimeType: string): string | null {
        // LibreOffice route handles most Office documents
        const libreOfficeTypes = [
            // Microsoft Office
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            'application/msword', // .doc
            'application/vnd.ms-excel', // .xls
            'application/vnd.ms-powerpoint', // .ppt
            // OpenOffice/LibreOffice
            'application/vnd.oasis.opendocument.text', // .odt
            'application/vnd.oasis.opendocument.spreadsheet', // .ods
            'application/vnd.oasis.opendocument.presentation', // .odp
            // Other formats
            'text/rtf', // .rtf
            'text/csv', // .csv
            'text/html', // .html
            'application/rtf',
        ];

        if (libreOfficeTypes.includes(mimeType)) {
            return '/forms/libreoffice/convert';
        }

        // If it's already a PDF, we don't need to convert
        if (mimeType === 'application/pdf') {
            return null; // No conversion needed
        }

        // For HTML content, use Chromium route
        if (mimeType === 'text/html') {
            return '/forms/chromium/convert/html';
        }

        return null;
    }

    /**
     * Merge multiple PDF files into one
     * @param pdfBuffers Array of PDF buffers to merge
     * @returns Promise<Buffer> The merged PDF as Buffer
     */
    async mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
        this.logger.log(`Merging ${pdfBuffers.length} PDF files`);

        try {
            const url = `${this.gotenbergUrl}/forms/pdfengines/merge`;

            const formData = new FormData();

            // Add all PDF files
            pdfBuffers.forEach((buffer, index) => {
                formData.append('files', buffer, {
                    filename: `file${index + 1}.pdf`,
                    contentType: 'application/pdf',
                });
            });

            const response = await got.post(url, {
                body: formData,
                responseType: 'buffer',
            });

            const mergedBuffer = response.body;

            this.logger.log(`Successfully merged PDFs (${mergedBuffer.length} bytes)`);

            return mergedBuffer;
        } catch (error) {
            this.logger.error('Error merging PDFs:', error);
            throw new Error(`Gotenberg merge failed: ${error.message}`);
        }
    }
}
