import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, arquivo_preview_status } from '@prisma/client';
import AdmZip from 'adm-zip';
import { JSDOM } from 'jsdom';
import * as MinioJS from 'minio';
import * as sharp from 'sharp';
import { ColunasNecessarias, OrcamentoImportacaoHelpers } from 'src/importacao-orcamento/importacao-orcamento.common';
import { read } from 'xlsx';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { SmaeConfigService } from '../common/services/smae-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { deveGerarPreview } from './arquivo-preview.helper';
import { SolicitarPreviewResponseDto } from '../sysadmin/dto/upload/solicitar-preview.dto';
import { CreateUploadDto } from './dto/create-upload.dto';
import { PatchDiretorioDto } from './dto/diretorio.dto';
import { RestaurarDescricaoResponseDto } from './dto/restaurar-descricao-response.dto';
import { DownloadBody } from './entities/download.body';
import { Download } from './entities/download.entity';
import { TipoUpload } from './entities/tipo-upload';
import { UploadBody } from './entities/upload.body';
import { Upload } from './entities/upload.entity';
import { StorageService } from './storage-service';
import { THUMBNAIL_TYPES, isThumbnailType } from './thumbnail-config';
import { UploadDiretorioService } from './upload.diretorio.service';
import { GerarThumbnailDto } from './dto/gerar-thumbnail.dto';

const AdmZipLib = require('adm-zip');

interface TokenResponse {
    stream: NodeJS.ReadableStream;
    nome: string;
    mime_type: string;
}

const DOWNLOAD_AUD = 'dl';
const UPLOAD_AUD = 'upload';
const PUBLIC_AUD = 'public';

const ZipContentTypes = [
    'application/zip',
    'multipart/x-zip',
    'application/zip-compressed',
    'application/x-zip-compressed',
    'application/x-zip',
];

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly uploadDiretorio: UploadDiretorioService,
        private readonly smaeConfig: SmaeConfigService
    ) {}

    async upload(
        createUploadDto: CreateUploadDto,
        user: PessoaFromJwt,
        file: Express.Multer.File | { buffer: Buffer },
        ip: string
    ) {
        let originalname = '';

        if ('size' in file) {
            if (file.size < 1) {
                throw new HttpException('O arquivo precisa ter ao menos 1 byte!', 400);
            }

            if ('originalname' in file && createUploadDto.tipo_documento_id) {
                const tipoDoc = await this.prisma.tipoDocumento.findFirst({
                    where: { id: createUploadDto.tipo_documento_id },
                    select: { extensoes: true },
                });
                if (!tipoDoc) throw new HttpException('Tipo de Documento não encontrado', 404);

                const tipoDocExtensoes = tipoDoc.extensoes ? tipoDoc.extensoes.toLowerCase().split(',') || [] : [];
                if (tipoDocExtensoes.length > 0) {
                    // TODO adicionar inteligência para verificar mimetype por ext?
                    const extSomeExtExists = tipoDocExtensoes.some((ext) => {
                        return file.originalname.toLocaleLowerCase().endsWith('.' + ext.trim());
                    });

                    if (!extSomeExtExists)
                        throw new HttpException(
                            `Arquivo deve conter uma das extensões: ${tipoDoc.extensoes}; Nome do arquivo: ${file.originalname}`,
                            400
                        );
                }
            }

            await this.checkSizeAndFileType(createUploadDto, file);

            originalname = file.originalname;
            // bug do Multer, ele faz o decode pra latin1, entao vamos voltar de volta pra utf8
            // ou bug do chrome, https://stackoverflow.com/questions/72909624/multer-corrupts-utf8-filename-when-uploading-files
            // eslint-disable-next-line no-control-regex
            if (!/[^\u0000-\u00ff]/.test(originalname)) {
                originalname = Buffer.from(originalname, 'latin1').toString('utf8');
            }
        } else {
            originalname = createUploadDto.descricao ?? 'upload.bin';
        }

        const rejectUpload = await this.smaeConfig.getConfigBooleanWithDefault('REJEITAR_UPLOAD_COM_DESCRICAO', false);
        if (rejectUpload && createUploadDto.descricao)
            throw new HttpException(
                'O uso do campo "descrição" está obsoleto desde 2024-07-08 e não é permitido, envie apenas para o documento/FK.',
                400
            );

        const arquivoId = await this.nextSequence();

        const key = [
            'uploads',
            String(createUploadDto.tipo).toLocaleLowerCase(),
            'by-user',
            String(user.id),
            new Date(Date.now()).toISOString(),
            'arquivo-id-' + String(arquivoId),
            originalname.replace(/\s/g, '-').replace(/[^\w-\\.0-9_]*/gi, ''),
        ].join('/');

        createUploadDto.tipo_documento_id =
            createUploadDto.tipo_documento_id && createUploadDto.tipo_documento_id > 0
                ? createUploadDto.tipo_documento_id
                : null;

        const ct = 'mimetype' in file && file.mimetype ? file.mimetype : 'application/octet-stream';
        await this.storage.putBlob(key, file.buffer, {
            'Content-Type': ct,
            'x-user-id': user.id,
            'x-orgao-id': user.orgao_id || 'sem-orgao',
            'x-tipo': createUploadDto.tipo,
            'x-tipo-documento-id': createUploadDto.tipo_documento_id || 'sem-tipo',
            'x-uploaded-ip': ip || 'sem-ip',
            'x-description':
                typeof createUploadDto.descricao === 'string' ? encodeURIComponent(createUploadDto.descricao) : '',
        });

        await this.prisma.arquivo.create({
            data: {
                id: arquivoId,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                caminho: key,
                nome_original: originalname,
                mime_type: ct,
                tamanho_bytes: 'size' in file ? file.size : file.buffer.length,
                tipo: String(createUploadDto.tipo),
                tipo_documento_id: createUploadDto.tipo_documento_id,
            },
            select: { id: true },
        });

        // Schedule thumbnail generation task if applicable
        await this.agendarThumbnailSeNecessario(arquivoId, String(createUploadDto.tipo), user.id);

        // Schedule preview task if applicable
        await this.agendarPreviewSeNecessario(
            arquivoId,
            String(createUploadDto.tipo),
            'size' in file ? file.size : file.buffer.length,
            originalname,
            ct,
            user.id
        );

        return arquivoId;
    }

    private async agendarPreviewSeNecessario(
        arquivoId: number,
        tipo: string,
        tamanhoBytes: number,
        nomeOriginal: string,
        mimeType: string,
        userId: number
    ): Promise<void> {
        const resultado = deveGerarPreview(tipo, tamanhoBytes, nomeOriginal, mimeType);

        if (!resultado.gerar) {
            // Mark as 'pulado' if it's DOCUMENTO but won't generate
            if (tipo === 'DOCUMENTO') {
                await this.prisma.arquivo.update({
                    where: { id: arquivoId },
                    data: {
                        preview_status: 'pulado',
                        preview_erro_mensagem: resultado.motivo,
                        preview_atualizado_em: new Date(),
                    },
                });
            }
            return;
        }

        // Create task in queue
        const task = await this.prisma.task_queue.create({
            data: {
                type: 'gerar_preview_documento',
                status: 'pending',
                pessoa_id: userId,
                params: {
                    arquivo_id: arquivoId,
                    tipo_preview: resultado.tipoPreview,
                },
            },
        });

        // Update arquivo with task reference
        await this.prisma.arquivo.update({
            where: { id: arquivoId },
            data: {
                preview_status: 'pendente',
                preview_tipo: resultado.tipoPreview,
                preview_task_id: task.id,
                preview_criado_em: new Date(),
                preview_atualizado_em: new Date(),
            },
        });

        Logger.log(`Preview scheduled for arquivo ${arquivoId}, task ${task.id}, type: ${resultado.tipoPreview}`);
    }

    private async agendarThumbnailSeNecessario(arquivoId: number, tipo: string, userId: number): Promise<void> {
        if (!isThumbnailType(tipo)) {
            return;
        }

        const arquivo = await this.prisma.arquivo.findUnique({
            where: { id: arquivoId },
            select: { thumbnail_arquivo_id: true },
        });

        if (arquivo?.thumbnail_arquivo_id) {
            this.logger.debug(`Thumbnail already exists for arquivo ${arquivoId}, skipping task creation`);
            return;
        }

        const task = await this.prisma.task_queue.create({
            data: {
                type: 'gerar_thumbnail_imagem',
                status: 'pending',
                pessoa_id: userId,
                params: {
                    arquivo_id: arquivoId,
                    tipo_upload: tipo,
                },
            },
        });

        this.logger.log(`Thumbnail scheduled for arquivo ${arquivoId}, task ${task.id}, type: ${tipo}`);
    }

    async getById(id: number) {
        return this.prisma.arquivo.findFirstOrThrow({
            where: { id: id },
        });
    }

    private async checkSizeAndFileType(createUploadDto: CreateUploadDto, file: Express.Multer.File) {
        if (createUploadDto.tipo === TipoUpload.SHAPEFILE) {
            this.checkShapeFile(file);
        } else if (
            createUploadDto.tipo === TipoUpload.ICONE_TAG ||
            createUploadDto.tipo === TipoUpload.ICONE_PORTFOLIO
        ) {
            const maxIconSize = await this.smaeConfig.getConfigNumberWithDefault('UPLOAD_MAX_SIZE_ICON_BYTES', 512000);
            if (file.size > maxIconSize) {
                const maxSizeKB = Math.round(maxIconSize / 1024);
                throw new HttpException(`O arquivo de ícone precisa ser menor que ${maxSizeKB} kilobytes.`, 400);
            } else if (/\.(png|jpg|jpeg|svg)$/i.test(file.originalname) == false) {
                throw new HttpException('O arquivo de ícone precisa ser PNG, JPEG ou SVG.', 400);
            }
            await this.validateImageContent(file);
        } else if (createUploadDto.tipo === TipoUpload.IMPORTACAO_ORCAMENTO) {
            const maxBudgetImportSize = await this.smaeConfig.getConfigNumberWithDefault(
                'UPLOAD_MAX_SIZE_BUDGET_IMPORT_BYTES',
                10485760
            );
            if (file.size > maxBudgetImportSize) {
                const maxSizeMB = Math.round(maxBudgetImportSize / (1024 * 1024));
                throw new HttpException(`O arquivo de importação precisa ser menor que ${maxSizeMB} megabytes.`, 400);
            } else if (/\.(xls|xlsx|csv)$/i.test(file.originalname) == false) {
                throw new HttpException('O arquivo de ícone precisa ser xls, XLSX ou CSV.', 400);
            }

            await this.checkOrcamentoFile(file);
        } else if (createUploadDto.tipo === TipoUpload.LOGO_PDM) {
            if (/(\.png|svg)$/i.test(file.originalname) == false) {
                throw new HttpException('O arquivo do Logo do PDM precisa ser um arquivo SVG ou PNG', 400);
            }
            const maxLogoPdmSize = await this.smaeConfig.getConfigNumberWithDefault(
                'UPLOAD_MAX_SIZE_LOGO_PDM_BYTES',
                1048576
            );
            if (file.size > maxLogoPdmSize) {
                const maxSizeMB = Math.round(maxLogoPdmSize / (1024 * 1024));
                throw new HttpException(`O arquivo de Logo do PDM precisa ser menor que ${maxSizeMB} Megabyte`, 400);
            }
            await this.validateImageContent(file);
        } else if (createUploadDto.tipo === TipoUpload.FOTO_PARLAMENTAR) {
            if (/(\.png|jpg|jpeg)$/i.test(file.originalname) == false) {
                throw new HttpException(
                    'O arquivo de foto do parlamentar precisa ser um arquivo PNG, JPG ou JPEG',
                    400
                );
            }
            const maxFotoParlamentarSize = await this.smaeConfig.getConfigNumberWithDefault(
                'UPLOAD_MAX_SIZE_FOTO_PARLAMENTAR_BYTES',
                5242880
            );
            if (file.size > maxFotoParlamentarSize) {
                const maxSizeMB = Math.round(maxFotoParlamentarSize / (1024 * 1024));
                throw new HttpException(
                    `O arquivo de imagem do parlamentar precisa ser menor que ${maxSizeMB} Megabyte`,
                    400
                );
            }
            await this.validateImageContent(file);
        } else if (createUploadDto.tipo === TipoUpload.IMPORTACAO_PARLAMENTAR) {
            if (/(\.sqlite)$/i.test(file.originalname) == false) {
                throw new HttpException('O arquivo para importação de parlamentares precisa ser um .sqlite.', 400);
            } else if (file.size > 1048576 * 100) {
                throw new HttpException(
                    'O arquivo para importação de parlamentares precisa ser menor que 100 Megabyte',
                    400
                );
            }
        }
    }

    private async validateImageContent(file: Express.Multer.File): Promise<void> {
        const isSvg = /\.svg$/i.test(file.originalname);

        if (isSvg) {
            // Parse full file buffer with JSDOM to validate SVG structure
            const dom = new JSDOM(file.buffer.toString('utf-8'), { contentType: 'image/svg+xml' });
            try {
                const document = dom.window.document;

                // Validate that the parsed document contains a top-level <svg> element
                if (!document.querySelector('svg')) {
                    throw new HttpException('O arquivo não é um SVG válido.', 400);
                }
            } catch (error) {
                if (error instanceof HttpException) throw error;
                throw new HttpException('O arquivo não é um SVG válido.', 400);
            } finally {
                // Always close the JSDOM window to prevent memory leaks
                if (dom && dom.window) dom.window.close();
            }
        } else {
            try {
                const metadata = await sharp(file.buffer).metadata();
                if (!metadata.width || !metadata.height) {
                    throw new Error('Imagem sem dimensões');
                }
            } catch {
                throw new HttpException(
                    'O arquivo não é uma imagem válida. Verifique se o conteúdo corresponde à extensão.',
                    400
                );
            }
        }
    }

    private checkShapeFile(file: Express.Multer.File) {
        if (/\.zip$/i.test(file.originalname) == false || ZipContentTypes.includes(file.mimetype) == false) {
            throw new HttpException(
                `O arquivo precisa ser do tipo arquivo ZIP\n\nRecebido mimetype=${
                    file.mimetype
                }, aceito apenas ${ZipContentTypes.join(', ')}\nOriginal Name=${file.originalname}, aceito apenas .zip`,
                400
            );
        } else if (file.size > 2097152) {
            throw new HttpException(
                `O arquivo ZIP precisa ser menor que 2 Megabytes.\n Recebido ${file.size} bytes`,
                400
            );
        }

        let totalSize = 0;
        let hasShp = false,
            hasDbf = false,
            hasShx = false,
            hasCpg = false;
        try {
            const zip = new AdmZipLib(file.buffer) as AdmZip;
            const entries = zip.getEntries();

            entries.forEach((entry) => {
                totalSize += entry.header.size;
                const entryName = entry.entryName.toLocaleLowerCase();
                if (entryName.endsWith('.shp')) hasShp = true;
                if (entryName.endsWith('.dbf')) hasDbf = true;
                if (entryName.endsWith('.shx')) hasShx = true;
                if (entryName.endsWith('.cpg')) hasCpg = true;
            });
        } catch (error) {
            throw new HttpException(`Erro ao abrir arquivo zip: ${error}`, 400);
        }

        if (!hasShp || !hasDbf || !hasShx || !hasCpg) {
            const missingExtensions = [];
            if (!hasShp) missingExtensions.push('.shp');
            if (!hasDbf) missingExtensions.push('.dbf');
            if (!hasShx) missingExtensions.push('.shx');
            if (!hasCpg) missingExtensions.push('.cpg');

            const errorMessage = 'O arquivo ZIP não contém os arquivos necessários: ' + missingExtensions.join(', ');
            throw new HttpException(errorMessage, 400);
        } else if (totalSize >= 100 * 1024 * 1024) {
            const errorMessage =
                'O tamanho total do arquivo zip após a descompactação excede 100 MB. Isso pode travar os leitores em navegador.';
            throw new HttpException(errorMessage, 400);
        }
    }

    private async checkOrcamentoFile(file: Express.Multer.File) {
        try {
            const planilia = read(file.buffer, {
                type: 'buffer',
                sheetRows: 2,
            });

            if (planilia.SheetNames.length !== 1)
                throw new BadRequestException(
                    `Deve haver apenas uma página (planilha). Foram recebidas ${
                        planilia.SheetNames.length
                    }: ${planilia.SheetNames.join(', ')}`
                );

            const folha = planilia.Sheets[planilia.SheetNames[0]];
            if (!folha['!ref']) throw new BadRequestException('primeira folha não definida');

            const colunasIdx = OrcamentoImportacaoHelpers.createColumnHeaderIndex(folha, [...ColunasNecessarias]);

            const colunas: string[] = Object.keys(colunasIdx);

            const missingColumns = ColunasNecessarias.filter((column) => !colunas.includes(column));
            if (missingColumns.length > 0) {
                throw new BadRequestException(`Colunas não encontradas: ${missingColumns.join(', ')}`);
            }
        } catch (error) {
            console.log(error);
            throw new HttpException(`Não foi possível efetuar a leitura do arquivo: ${error}`, 400);
        }
    }

    async uploadReport(
        category: string,
        filename: string,
        buffer: Buffer,
        mimetype: string | undefined,
        user: PessoaFromJwt | null
    ) {
        const originalname = filename;

        const arquivoId = await this.nextSequence();

        const key = [
            'reports',
            category,
            'by-user',
            user ? String(user.id) : 'sistema',
            new Date(Date.now()).toISOString(),
            'arquivo-id-' + String(arquivoId),
            originalname.replace(/\s/g, '-').replace(/[^\w-\\.0-9_]*/gi, ''),
        ].join('/');

        console.log(`==========================================`);
        console.log(`Uploading report to key: ${key}`);
        console.log(`Buffer length: ${buffer.length}`);

        const obj = await this.storage.putBlob(key, buffer, {
            'Content-Type': mimetype || 'application/octet-stream',
            'x-user-id': user ? user.id : 'sistema',
            'x-orgao-id': user ? user.orgao_id || 'sem-orgao' : 'n/a',
            'x-category': category,
            'x-tipo': 'reports',
        });

        console.log(obj);

        console.log(`==========================================`);

        await this.prisma.arquivo.create({
            data: {
                id: arquivoId,
                criado_por: user ? user.id : null,
                criado_em: new Date(Date.now()),
                caminho: key,
                nome_original: originalname,
                mime_type: mimetype || 'application/octet-stream',
                tamanho_bytes: buffer.length,
                tipo: 'reports',
            },
            select: { id: true },
        });

        return arquivoId;
    }

    private async nextSequence() {
        const nextVal: any[] = await this.prisma.$queryRaw`select nextval('arquivo_id_seq'::regclass) as id`;

        const arquivoId = Number(nextVal[0].id);
        return arquivoId;
    }

    async getUploadToken(id: number): Promise<Upload> {
        return {
            upload_token: this.jwtService.sign(
                {
                    arquivo_id: id,
                    aud: UPLOAD_AUD,
                },
                { expiresIn: '30d' }
            ),
        } as Upload;
    }

    // aceita tanto um token de upload ou de download
    // eu não acho bom, mas convencido fazer isso pra atrapalhar menos o form do frontend
    checkUploadOrDownloadToken(token: string): number {
        let decoded: UploadBody | null = null;
        try {
            decoded = this.jwtService.verify(token) as UploadBody;
        } catch (error) {
            console.log(error);
        }
        if (!decoded || ![UPLOAD_AUD, DOWNLOAD_AUD].includes(decoded.aud))
            throw new HttpException('upload_token inválido', 400);

        return decoded.arquivo_id;
    }

    getDownloadToken(id: number, expiresIn: string | undefined): Download {
        if (!expiresIn) expiresIn = '60 minutes';

        return {
            download_token: this.jwtService.sign(
                {
                    arquivo_id: id,
                    aud: DOWNLOAD_AUD,
                },
                { expiresIn: expiresIn }
            ),
        } as Download;
    }

    getPersistentDownloadToken(id: number | null): string | null {
        if (!id) return null;

        return this.jwtService.sign(
            {
                arquivo_id: id,
                aud: DOWNLOAD_AUD,
            },
            { noTimestamp: true }
        );
    }

    getPublicDownloadToken(id: number, expiresIn: string | undefined): string {
        if (!expiresIn) expiresIn = '30d';

        return this.jwtService.sign(
            {
                arquivo_id: id,
                aud: PUBLIC_AUD,
            },
            { expiresIn: expiresIn }
        );
    }

    checkPublicToken(token: string): number {
        let decoded: UploadBody | null = null;
        try {
            decoded = this.jwtService.verify(token) as UploadBody;
        } catch (error) {
            console.log(error);
        }
        if (!decoded || decoded.aud !== PUBLIC_AUD) throw new HttpException('Token publico invalido', 400);

        return decoded.arquivo_id;
    }

    checkDownloadToken(downloadToken: string): number {
        let decoded: UploadBody | null = null;
        try {
            decoded = this.jwtService.verify(downloadToken) as DownloadBody;
        } catch (error) {
            console.log(error);
        }
        if (!decoded || decoded.aud != DOWNLOAD_AUD) throw new HttpException('download_token inválido', 400);

        return decoded.arquivo_id;
    }

    async getReadableStreamByToken(downloadToken: string): Promise<TokenResponse> {
        const arquivo = await this.prisma.arquivo.findFirst({
            where: { id: this.checkDownloadToken(downloadToken) },
            select: { caminho: true, nome_original: true, mime_type: true },
        });

        if (!arquivo) throw new HttpException('Arquivo não encontrado', 400);

        return {
            stream: await this.storage.getStream(arquivo.caminho),
            nome: arquivo.nome_original,
            mime_type: arquivo.mime_type || 'application/octet-stream',
        };
    }

    async getReadableStreamById(id: number): Promise<TokenResponse> {
        const arquivo = await this.prisma.arquivo.findFirstOrThrow({
            where: { id: id },
            select: { caminho: true, nome_original: true, mime_type: true },
        });

        return {
            stream: await this.storage.getStream(arquivo.caminho),
            nome: arquivo.nome_original,
            mime_type: arquivo.mime_type || 'application/octet-stream',
        };
    }

    async getPathById(id: number): Promise<string> {
        const arquivo = await this.prisma.arquivo.findFirstOrThrow({
            where: { id: id },
            select: { caminho: true },
        });

        return arquivo.caminho;
    }

    async updateDir(
        dto: PatchDiretorioDto,
        uploadOrDlToken: string,
        prismaTx: Prisma.TransactionClient | null = null
    ): Promise<void> {
        const prisma = prismaTx || this.prisma;
        const arquivo = await prisma.arquivo.findFirst({
            where: { id: this.checkUploadOrDownloadToken(uploadOrDlToken) },
            select: { id: true },
        });

        if (!arquivo) throw new HttpException('Arquivo não encontrado', 400);

        await prisma.arquivo.update({
            where: { id: arquivo.id },
            data: {
                diretorio_caminho: this.uploadDiretorio.normalizaCaminho(dto.caminho),
            },
        });

        // SRP foi viajar
        // precisa saber se o arquivo é de algum projeto, se não, não tem como colocar no contexto certo
        const projetoDoc = await prisma.projetoDocumento.findFirst({
            where: {
                arquivo_id: arquivo.id,
            },
            select: { projeto_id: true },
        });
        if (projetoDoc && projetoDoc.projeto_id) {
            await this.uploadDiretorio.create({
                caminho: dto.caminho,
                projeto_id: projetoDoc.projeto_id,
            });
        }

        const transferenciaDoc = await prisma.transferenciaAnexo.findFirst({
            where: { arquivo_id: arquivo.id },
            select: { transferencia_id: true },
        });
        if (transferenciaDoc && transferenciaDoc.transferencia_id) {
            await this.uploadDiretorio.create({
                caminho: dto.caminho,
                transferencia_id: transferenciaDoc.transferencia_id,
            });
        }

        const pdmDoc = await prisma.pdmDocumento.findFirst({
            where: { arquivo_id: arquivo.id },
            select: { pdm_id: true },
        });
        if (pdmDoc && pdmDoc.pdm_id) {
            await this.uploadDiretorio.create({
                caminho: dto.caminho,
                pdm_id: pdmDoc.pdm_id,
            });
        }
    }

    async restauraDescricaoPeloMetadado(batchSize = 500): Promise<RestaurarDescricaoResponseDto> {
        const result: RestaurarDescricaoResponseDto = {
            total: 0,
            restored: 0,
            errors: 0,
            skipped: 0,
        };

        try {
            const records = await this.prisma.metaCicloFisicoAnaliseDocumento.findMany({
                where: {
                    descricao: null,
                    removido_em: null,
                },
                select: {
                    id: true,
                    arquivo_id: true,
                    arquivo: {
                        select: {
                            caminho: true,
                        },
                    },
                },
                take: batchSize,
            });

            result.total = records.length;
            Logger.log(`Found ${result.total} records with NULL description to process`);

            for (const record of records) {
                try {
                    if (!record.arquivo || !record.arquivo.caminho) {
                        Logger.warn(`Skipping record ${record.id}: Missing arquivo or caminho`);
                        result.skipped++;
                        continue;
                    }

                    let description: string | null = null;
                    let metadata: MinioJS.ItemBucketMetadata | null = null;
                    try {
                        metadata = await this.storage.getObjectMetadata(record.arquivo.caminho);
                    } catch (error) {
                        if (error?.code == 'NotFound') {
                            Logger.warn(`Skipping record ${record.id}: File not found in storage`);
                            description = '404';
                        } else {
                            throw error;
                        }
                    }

                    if (metadata && 'x-description' in metadata && metadata['x-description'])
                        description = decodeURIComponent(metadata['x-description']);

                    if (!description) description = '';

                    await this.prisma.metaCicloFisicoAnaliseDocumento.update({
                        where: { id: record.id },
                        data: { descricao: description },
                    });

                    Logger.log(
                        `description for record ${record.id}: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`
                    );
                    result.restored++;
                } catch (error) {
                    Logger.error(`Error processing record ${record.id}:`, error);
                    result.errors++;
                }
            }

            return result;
        } catch (error) {
            Logger.error('Error in restoreDescriptionsFromMetadata:', error);
            throw error;
        }
    }

    async solicitarPreview(token: string, userId: number): Promise<SolicitarPreviewResponseDto> {
        const arquivoId = this.checkUploadOrDownloadToken(token);

        // Get arquivo details
        const arquivo = await this.prisma.arquivo.findUnique({
            where: { id: arquivoId },
            select: {
                id: true,
                tipo: true,
                tamanho_bytes: true,
                nome_original: true,
                mime_type: true,
                preview_status: true,
                preview_task_id: true,
                preview_tipo: true,
            },
        });

        if (!arquivo) {
            return {
                aceito: false,
                mensagem: 'Arquivo não encontrado',
                status: 'erro' as arquivo_preview_status,
            };
        }

        // Check if preview can be generated for this file
        const resultado = deveGerarPreview(
            arquivo.tipo,
            arquivo.tamanho_bytes,
            arquivo.nome_original,
            arquivo.mime_type || ''
        );

        if (!resultado.gerar) {
            return {
                aceito: false,
                mensagem: resultado.motivo || 'Preview não suportado para este tipo de arquivo',
                status: arquivo.preview_status || ('pulado' as arquivo_preview_status),
            };
        }

        // Check current preview status
        if (arquivo.preview_status === 'concluido') {
            return {
                aceito: false,
                mensagem: 'Preview já foi gerado anteriormente',
                status: 'concluido' as arquivo_preview_status,
            };
        }

        if (arquivo.preview_status === 'executando') {
            return {
                aceito: false,
                mensagem: 'Preview está sendo gerado no momento',
                status: 'executando' as arquivo_preview_status,
            };
        }

        if (arquivo.preview_status === 'pendente' && arquivo.preview_task_id) {
            // Check if task is still pending
            const task = await this.prisma.task_queue.findUnique({
                where: { id: arquivo.preview_task_id },
                select: { status: true },
            });

            if (task && (task.status === 'pending' || task.status === 'running')) {
                return {
                    aceito: false,
                    mensagem: 'Preview já está agendado para geração',
                    status: 'pendente' as arquivo_preview_status,
                };
            }
        }

        // Schedule or reschedule preview task
        const task = await this.prisma.task_queue.create({
            data: {
                type: 'gerar_preview_documento',
                status: 'pending',
                pessoa_id: userId,
                params: {
                    arquivo_id: arquivoId,
                    tipo_preview: resultado.tipoPreview,
                },
            },
        });

        // Update arquivo with task reference
        await this.prisma.arquivo.update({
            where: { id: arquivoId },
            data: {
                preview_status: 'pendente',
                preview_tipo: resultado.tipoPreview,
                preview_task_id: task.id,
                preview_criado_em: arquivo.preview_status ? undefined : new Date(),
                preview_atualizado_em: new Date(),
                preview_erro_mensagem: null, // Clear previous error if any
            },
        });

        this.logger.log(
            `Preview manually requested for arquivo ${arquivoId} by user ${userId}, task ${task.id}, type: ${resultado.tipoPreview}`
        );

        return {
            aceito: true,
            mensagem: `Preview ${arquivo.preview_status === 'erro' ? 'reagendado' : 'agendado'} para geração`,
            status: 'pendente' as arquivo_preview_status,
        };
    }

    async processarPreviewsPendentes(userId: number): Promise<{ total: number; agendados: number; pulados: number }> {
        this.logger.log(`Processing all pending previews in batch`);

        // Find arquivos that don't have previews or have failed previews
        const arquivos = await this.prisma.arquivo.findMany({
            where: {
                tipo: 'DOCUMENTO',
                OR: [{ preview_status: 'pulado' }, { preview_status: 'erro' }],
            },
            select: {
                id: true,
                tipo: true,
                tamanho_bytes: true,
                nome_original: true,
                mime_type: true,
                preview_status: true,
                preview_task_id: true,
            },
            orderBy: {
                criado_em: 'desc',
            },
        });

        let agendados = 0;
        let pulados = 0;

        for (const arquivo of arquivos) {
            // Check if preview can be generated
            const resultado = deveGerarPreview(
                arquivo.tipo,
                arquivo.tamanho_bytes,
                arquivo.nome_original,
                arquivo.mime_type || ''
            );

            if (!resultado.gerar) {
                pulados++;
                // Update status to indicate it was checked and skipped
                await this.prisma.arquivo.update({
                    where: { id: arquivo.id },
                    data: {
                        preview_status: 'pulado',
                        preview_erro_mensagem: resultado.motivo || 'Tipo de arquivo não suportado',
                        preview_atualizado_em: new Date(),
                    },
                });
                continue;
            }

            try {
                // Create preview task
                const task = await this.prisma.task_queue.create({
                    data: {
                        type: 'gerar_preview_documento',
                        status: 'pending',
                        pessoa_id: userId,
                        params: {
                            arquivo_id: arquivo.id,
                            tipo_preview: resultado.tipoPreview,
                        },
                    },
                });

                // Update arquivo
                await this.prisma.arquivo.update({
                    where: { id: arquivo.id },
                    data: {
                        preview_status: 'pendente',
                        preview_tipo: resultado.tipoPreview,
                        preview_task_id: task.id,
                        preview_criado_em: arquivo.preview_status ? undefined : new Date(),
                        preview_atualizado_em: new Date(),
                        preview_erro_mensagem: null,
                    },
                });

                agendados++;
            } catch (error) {
                this.logger.error(`Error scheduling preview for arquivo ${arquivo.id}:`, error);
                pulados++;
            }
        }

        this.logger.log(
            `Batch preview processing completed. Total: ${arquivos.length}, Scheduled: ${agendados}, Skipped: ${pulados}`
        );

        return {
            total: arquivos.length,
            agendados,
            pulados,
        };
    }

    async solicitarThumbnail(token: string, userId: number): Promise<{ aceito: boolean; mensagem: string }> {
        const arquivoId = this.checkUploadOrDownloadToken(token);

        const arquivo = await this.prisma.arquivo.findUnique({
            where: { id: arquivoId },
            select: {
                id: true,
                tipo: true,
                thumbnail_arquivo_id: true,
            },
        });

        if (!arquivo) {
            return {
                aceito: false,
                mensagem: 'Arquivo não encontrado',
            };
        }

        if (!isThumbnailType(arquivo.tipo)) {
            return {
                aceito: false,
                mensagem: `Tipo de arquivo ${arquivo.tipo} não suporta geração de thumbnail`,
            };
        }

        // Schedule thumbnail task
        const task = await this.prisma.task_queue.create({
            data: {
                type: 'gerar_thumbnail_imagem',
                status: 'pending',
                pessoa_id: userId,
                params: {
                    arquivo_id: arquivoId,
                    tipo_upload: arquivo.tipo,
                    reprocessar: true,
                } satisfies GerarThumbnailDto,
            },
        });

        this.logger.log(`Thumbnail manually requested for arquivo ${arquivoId} by user ${userId}, task ${task.id}`);

        return {
            aceito: true,
            mensagem: 'Thumbnail agendado para geração',
        };
    }

    async processarThumbnailsPendentes(
        userId: number,
        tipoFiltro: string | undefined,
        reprocessar: boolean | undefined
    ): Promise<{ total: number; agendados: number; pulados: number }> {
        this.logger.log(
            `Processing thumbnails in batch${tipoFiltro ? ` for tipo=${tipoFiltro}` : ' for all thumbnail types'}`
        );

        const where: Prisma.ArquivoWhereInput = {
            thumbnail_arquivo_id: reprocessar ? undefined : null,
        };

        if (tipoFiltro) {
            if (!isThumbnailType(tipoFiltro)) {
                throw new HttpException(`Tipo ${tipoFiltro} não é um tipo válido para thumbnail`, 400);
            }
            where.tipo = tipoFiltro;
        } else {
            where.tipo = { in: Object.keys(THUMBNAIL_TYPES) };
        }

        const arquivos = await this.prisma.arquivo.findMany({
            where,
            select: {
                id: true,
                tipo: true,
                thumbnail_arquivo_id: true,
            },
            orderBy: {
                criado_em: 'desc',
            },
        });

        let agendados = 0;
        let pulados = 0;

        for (const arquivo of arquivos) {
            if (!isThumbnailType(arquivo.tipo)) {
                pulados++;
                continue;
            }

            try {
                // Create thumbnail task
                const task = await this.prisma.task_queue.create({
                    data: {
                        type: 'gerar_thumbnail_imagem',
                        status: 'pending',
                        pessoa_id: userId,
                        params: {
                            arquivo_id: arquivo.id,
                            tipo_upload: arquivo.tipo,
                            reprocessar: reprocessar,
                        } satisfies GerarThumbnailDto,
                    },
                });

                this.logger.debug(`Scheduled thumbnail task ${task.id} for arquivo ${arquivo.id}`);
                agendados++;
            } catch (error) {
                this.logger.error(`Error scheduling thumbnail for arquivo ${arquivo.id}:`, error);
                pulados++;
            }
        }

        this.logger.log(
            `Batch thumbnail processing completed. Total: ${arquivos.length}, Scheduled: ${agendados}, Skipped: ${pulados}`
        );

        return {
            total: arquivos.length,
            agendados,
            pulados,
        };
    }
}
