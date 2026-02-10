import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskableService } from '../task/entities/task.entity';
import { CONST_BOT_USER_ID } from '../common/consts';
import { StorageService } from './storage-service';
import { UploadService } from './upload.service';
import { isThumbnailType } from './thumbnail-config';

@Injectable()
export class ThumbnailService implements TaskableService {
    private readonly logger = new Logger(ThumbnailService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly uploadService: UploadService
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

            // Use the existing generateAndStoreThumbnail method from UploadService
            const thumbnailId = await this.uploadService.generateAndStoreThumbnail(
                arquivoId,
                file,
                tipoUpload,
                arquivo.criado_por || CONST_BOT_USER_ID
            );

            if (thumbnailId) {
                this.logger.log(`[Job ${jobId}] Thumbnail generated successfully for arquivo ${arquivoId}, thumbnail ID: ${thumbnailId}`);
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
}
