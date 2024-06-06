import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Database } from 'duckdb-async';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { TaskableService } from '../entities/task.entity';
import { CreateImportacaoParlamentarDto } from './dto/create-parlamentar.dto';
import { StorageService } from '../../upload/storage-service';

const TMP_PATH = '/tmp/';
@Injectable()
export class ImportacaoParlamentarService implements TaskableService {
    private readonly logger = new Logger(ImportacaoParlamentarService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => UploadService)) private readonly uploadService: UploadService,
        @Inject(forwardRef(() => StorageService)) private readonly storageService: StorageService
    ) {}

    private getTmpFilePath(fileName: string, taskId: string): string {
        return TMP_PATH + ['job', taskId, fileName].join('-');
    }
    async executeJob(inputParams: CreateImportacaoParlamentarDto, taskId: string): Promise<any> {
        this.logger.verbose(`Carregando importação parlamentar id ${inputParams.upload_token}`);

        const uploadId = this.uploadService.checkDownloadToken(inputParams.upload_token);
        if (!uploadId) {
            throw new Error('Upload não encontrado');
        }

        const path = this.uploadService.getPathById(uploadId);

        const db = await Database.create(this.getTmpFilePath('db-at-' + Date.now() + '.duckdb', taskId));

        db.all('INSTALL https; INSTALL postgres; INSTALL sqlite;');
        db.all('LOAD https; LOAD postgres; LOAD sqlite;');

        db.run('ATTACH ? (TYPE SQLITE) AS importacao;', path);

        await db.close();

        return {
            _taskId: taskId,
        };
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        this.logger.verbose(JSON.stringify(executeOutput));
        return JSON.stringify(executeOutput) as any;
    }
}
