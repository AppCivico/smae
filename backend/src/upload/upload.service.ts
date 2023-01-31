import { ReadStream } from 'fs';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage-service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { Upload } from './entities/upload.entity';
import { JwtService } from '@nestjs/jwt';
import { UploadBody } from './entities/upload.body';
import { DownloadBody } from './entities/download.body';
import { Download } from './entities/download.entity';
import { TipoUpload } from './entities/tipo-upload';

interface TokenResponse {
    stream: NodeJS.ReadableStream;
    nome: string;
    mime_type: string;
}

const DOWNLOAD_AUD = 'dl';
const UPLOAD_AUD = 'upload';

@Injectable()
export class UploadService {
    constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService, private readonly storage: StorageService) {}

    async upload(createUploadDto: CreateUploadDto, user: PessoaFromJwt, file: Express.Multer.File, ip: string) {
        if (file.size < 1) {
            throw new HttpException('O arquivo precisa ter pelo menos 1 byte!', 400);
        }

        if (createUploadDto.tipo_documento_id) {
            const tipoDoc = await this.prisma.tipoDocumento.findFirst({
                where: { id: createUploadDto.tipo_documento_id },
                select: { extensoes: true },
            });
            if (!tipoDoc) throw new HttpException('Tipo de Documento não encontrado', 404);

            const tipoDocExtensoes = tipoDoc.extensoes ? tipoDoc.extensoes.toLowerCase().split(',') || [] : [];
            if (tipoDocExtensoes.length > 0) {
                // TODO adicionar inteligência para verificar mimetype por ext?
                const extSomeExtExists = tipoDocExtensoes.some(ext => {
                    return file.originalname.toLocaleLowerCase().endsWith('.' + ext.trim());
                });

                if (!extSomeExtExists) throw new HttpException(`Arquivo deve contem um das extensões: ${tipoDoc.extensoes}; Nome do arquivo: ${file.originalname}`, 400);
            }
        }
        if (createUploadDto.tipo === TipoUpload.SHAPEFILE) {
            if (/\.zip$/i.test(file.originalname) == false || file.mimetype != 'application/zip') {
                throw new HttpException('O arquivo de shapefile precisa ser um arquivo ZIP', 400);
            } else if (file.size > 2097152) {
                throw new HttpException('O arquivo de shapefile precisa ser menor que 2 Megabytes', 400);
            }
        } else if (createUploadDto.tipo === TipoUpload.ICONE_TAG) {
            if (file.size > 204800) {
                throw new HttpException('O arquivo de ícone precisa ser menor que 200 kilobytes.', 400);
            } else if (/\.(png|jpg|jpeg|svg)$/i.test(file.originalname) == false) {
                throw new HttpException('O arquivo de ícone precisa ser PNG, JPEG ou SVG.', 400);
            }
        } else if (createUploadDto.tipo === TipoUpload.LOGO_PDM) {
            if (/(\.png|svg)$/i.test(file.originalname) == false) {
                throw new HttpException('O arquivo do Logo do PDM precisa ser um arquivo SVG ou PNG', 400);
            } else if (file.size > 1048576) {
                throw new HttpException('O arquivo de Logo do PDM precisa ser menor que 1 Megabyte', 400);
            }
        }

        let originalname = file.originalname;
        // bug do Multer, ele faz o decode pra latin1, entao vamos voltar de volta pra utf8
        // ou bug do chrome, https://stackoverflow.com/questions/72909624/multer-corrupts-utf8-filename-when-uploading-files
        if (!/[^\u0000-\u00ff]/.test(originalname)) {
            originalname = Buffer.from(originalname, 'latin1').toString('utf8');
        }

        const arquivoId = await this.nextSequence();

        const key = [
            'uploads',
            String(createUploadDto.tipo).toLocaleLowerCase(),
            'by-user',
            String(user.id),
            new Date(Date.now()).toISOString(),
            'arquivo-id-' + String(arquivoId),
            originalname.replace(/\s/g, '-').replace(/[^\w-\.0-9_]*/gi, ''),
        ].join('/');

        createUploadDto.tipo_documento_id = createUploadDto.tipo_documento_id && createUploadDto.tipo_documento_id > 0 ? createUploadDto.tipo_documento_id : null;

        await this.storage.putBlob(key, file.buffer, {
            'Content-Type': file.mimetype || 'application/octet-stream',
            'x-user-id': user.id,
            'x-orgao-id': user.orgao_id || 'sem-orgao',
            'x-tipo': createUploadDto.tipo,
            'x-tipo-documento-id': createUploadDto.tipo_documento_id || 'sem-tipo',
            'x-uploaded-ip': ip || 'sem-ip',
        });

        await this.prisma.arquivo.create({
            data: {
                id: arquivoId,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                caminho: key,
                nome_original: originalname,
                mime_type: file.mimetype || 'application/octet-stream',
                tamanho_bytes: file.size,
                descricao: createUploadDto.descricao,
                tipo: String(createUploadDto.tipo),
                tipo_documento_id: createUploadDto.tipo_documento_id,
            },
            select: { id: true },
        });

        return arquivoId;
    }

    async uploadReport(category: string, filename: string, buffer: Buffer, mimetype: string | undefined, user: PessoaFromJwt) {
        const originalname = filename;

        const arquivoId = await this.nextSequence();

        const key = [
            'reports',
            category,
            'by-user',
            String(user.id),
            new Date(Date.now()).toISOString(),
            'arquivo-id-' + String(arquivoId),
            originalname.replace(/\s/g, '-').replace(/[^\w-\.0-9_]*/gi, ''),
        ].join('/');

        await this.storage.putBlob(key, buffer, {
            'Content-Type': mimetype || 'application/octet-stream',
            'x-user-id': user.id,
            'x-orgao-id': user.orgao_id || 'sem-orgao',
            'x-category': category,
            'x-tipo': 'reports',
        });

        await this.prisma.arquivo.create({
            data: {
                id: arquivoId,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                caminho: key,
                nome_original: originalname,
                mime_type: mimetype || 'application/octet-stream',
                tamanho_bytes: buffer.length,
                descricao: '',
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
                { expiresIn: '30 days' },
            ),
        } as Upload;
    }

    // aceita tanto um token de upload ou de download
    // eu não acho bom, mas convencido fazer isso pra atrapalhar menos o form do frontend
    checkUploadToken(token: string): number {
        let decoded: UploadBody | null = null;
        try {
            decoded = this.jwtService.decode(token) as UploadBody;
        } catch (error) {
            console.log(error);
        }
        if (!decoded || ![UPLOAD_AUD, DOWNLOAD_AUD].includes(decoded.aud)) throw new HttpException('upload_token inválido', 400);

        return decoded.arquivo_id;
    }

    getDownloadToken(id: number, expiresIn: string): Download {
        if (!expiresIn) expiresIn = '10 minutes';

        return {
            download_token: this.jwtService.sign(
                {
                    arquivo_id: id,
                    aud: DOWNLOAD_AUD,
                },
                { expiresIn },
            ),
        } as Download;
    }

    checkDownloadToken(downloadToken: string): number {
        let decoded: UploadBody | null = null;
        try {
            decoded = this.jwtService.decode(downloadToken) as DownloadBody;
        } catch (error) {
            console.log(error);
        }
        if (!decoded || decoded.aud != DOWNLOAD_AUD) throw new HttpException('download_token inválido', 400);

        return decoded.arquivo_id;
    }

    async getBufferByToken(downloadToken: string): Promise<TokenResponse> {
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
}
