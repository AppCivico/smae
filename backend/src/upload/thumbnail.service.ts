import { Injectable, Logger } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import * as sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { TaskableService } from '../task/entities/task.entity';
import { CONST_BOT_USER_ID } from '../common/consts';
import { SmaeConfigService } from '../common/services/smae-config.service';
import { StorageService } from './storage-service';
import { THUMBNAIL_TYPES, isThumbnailType } from './thumbnail-config';

@Injectable()
export class ThumbnailService implements TaskableService {
    private readonly logger = new Logger(ThumbnailService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly smaeConfig: SmaeConfigService
    ) {}

    /**
     * TaskableService implementation - execute the thumbnail generation job
     */
    async executeJob(params: any, jobId: string): Promise<any> {
        const arquivoId = params.arquivo_id;
        const tipoUpload = params.tipo_upload;

        this.logger.log(`[Job ${jobId}] Processing thumbnail for arquivo ${arquivoId}, type: ${tipoUpload}`);

        if (!isThumbnailType(tipoUpload)) {
            throw new Error(`Invalid tipo_upload for thumbnail generation: ${tipoUpload}`);
        }

        try {
            const arquivo = await this.prisma.arquivo.findUnique({
                where: { id: arquivoId },
                select: {
                    id: true,
                    caminho: true,
                    nome_original: true,
                    tipo: true,
                    criado_por: true,
                    thumbnail_arquivo_id: true,
                },
            });

            if (!arquivo) {
                throw new Error('Arquivo not found');
            }

            // If thumbnail already exists, skip (unless explicitly reprocessing)
            if (arquivo.thumbnail_arquivo_id) {
                this.logger.log(`Thumbnail already exists for arquivo ${arquivoId}, skipping`);
                return;
            }

            // Download original file from storage
            const stream = await this.storage.getStream(arquivo.caminho);
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);

            // Create file object matching Express.Multer.File structure
            const file = {
                buffer,
                originalname: arquivo.nome_original,
            };

            // Generate and store the thumbnail
            const thumbnailId = await this.generateAndStoreThumbnail(
                arquivoId,
                file,
                tipoUpload,
                arquivo.criado_por || CONST_BOT_USER_ID
            );

            if (thumbnailId) {
                this.logger.log(
                    `[Job ${jobId}] Thumbnail generated successfully for arquivo ${arquivoId}, thumbnail ID: ${thumbnailId}`
                );
                return { success: true, arquivo_id: arquivoId, thumbnail_arquivo_id: thumbnailId };
            } else {
                this.logger.warn(`[Job ${jobId}] Thumbnail generation skipped for arquivo ${arquivoId}`);
                return { success: false, arquivo_id: arquivoId, reason: 'Skipped' };
            }
        } catch (error) {
            this.logger.error(`[Job ${jobId}] Error generating thumbnail for arquivo ${arquivoId}:`, error);
            throw error;
        }
    }

    /**
     * TaskableService implementation - convert job output to JSON
     */
    outputToJson(executeOutput: any, _inputParams: any, _jobId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }

    /**
     * Generates a thumbnail from the original file and stores it
     */
    async generateAndStoreThumbnail(
        originalArquivoId: number,
        file: Express.Multer.File | { buffer: Buffer },
        tipoUpload: string,
        userId: number
    ): Promise<number | null> {
        const config = THUMBNAIL_TYPES[tipoUpload];
        if (!config) {
            this.logger.debug(`Thumbnail config not found for tipoUpload: ${tipoUpload}`);
            return null;
        }

        const originalname = 'originalname' in file ? file.originalname : '';
        const isSvg = /\.svg$/i.test(originalname);
        if (isSvg && !config.allowSvg) return null;

        let thumbnailBuffer: Buffer;
        let fileName: string;
        let mimeType: string;

        if (isSvg) {
            const dom = new JSDOM('');
            try {
                // Sanitize SVG with DOMPurify to remove dangerous tags/attributes
                const window = dom.window;
                const purify = DOMPurify(window);
                const svgString = file.buffer.toString('utf-8');

                const cleanSvg = purify.sanitize(svgString, {
                    USE_PROFILES: { svg: true, svgFilters: true },
                });

                thumbnailBuffer = Buffer.from(cleanSvg, 'utf-8');
                fileName = 'thumbnail.svg';
                mimeType = 'image/svg+xml';
            } finally {
                // Always close the JSDOM window to prevent memory leaks
                dom.window.close();
            }
        } else {
            // Convert raster images to WebP
            const width = await this.smaeConfig.getConfigNumberWithDefault(
                config.configKeys.width,
                config.defaultWidth
            );
            const height = await this.smaeConfig.getConfigNumberWithDefault(
                config.configKeys.height,
                config.defaultHeight
            );
            const quality = await this.smaeConfig.getConfigNumberWithDefault(
                config.configKeys.quality,
                config.defaultQuality
            );

            thumbnailBuffer = await sharp(file.buffer)
                .resize(width, height, { fit: config.fit, withoutEnlargement: true })
                .webp({ quality })
                .toBuffer();

            fileName = 'thumbnail.webp';
            mimeType = 'image/webp';
        }

        const thumbnailId = await this.nextSequence();
        const thumbnailKey = [
            'uploads',
            'thumbnail',
            `original-arquivo-id-${originalArquivoId}`,
            `arquivo-id-${thumbnailId}`,
            fileName,
        ].join('/');

        await this.storage.putBlob(thumbnailKey, thumbnailBuffer, {
            'Content-Type': mimeType,
            'x-user-id': String(userId),
            'x-tipo': 'THUMBNAIL',
            'x-original-arquivo-id': String(originalArquivoId),
        });

        // Use transaction to ensure atomic create and update
        await this.prisma.$transaction([
            this.prisma.arquivo.create({
                data: {
                    id: thumbnailId,
                    criado_por: userId,
                    criado_em: new Date(Date.now()),
                    caminho: thumbnailKey,
                    nome_original: fileName,
                    mime_type: mimeType,
                    tamanho_bytes: thumbnailBuffer.length,
                    tipo: 'THUMBNAIL',
                },
                select: { id: true },
            }),
            this.prisma.arquivo.update({
                where: { id: originalArquivoId },
                data: { thumbnail_arquivo_id: thumbnailId },
            }),
        ]);

        return thumbnailId;
    }

    private async nextSequence(): Promise<number> {
        const nextVal: any[] = await this.prisma.$queryRaw`select nextval('arquivo_id_seq'::regclass) as id`;
        const arquivoId = Number(nextVal[0].id);
        return arquivoId;
    }
}
