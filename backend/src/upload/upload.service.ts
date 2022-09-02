import { ReadStream } from 'fs';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/upload/storage-service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { Upload } from 'src/upload/entities/upload.entity';
import { JwtService } from '@nestjs/jwt';
import { UploadBody } from 'src/upload/entities/upload.body';
import { DownloadBody } from './entities/download.body';
import { Download } from './entities/download.entity';


@Injectable()
export class UploadService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) { }

    async upload(createUploadDto: CreateUploadDto, user: PessoaFromJwt, file: Express.Multer.File, ip: string) {

        if (createUploadDto.tipo_documento_id) {
            const tipoDoc = await this.prisma.tipoDocumento.count({ where: { id: createUploadDto.tipo_documento_id } });
            if (!tipoDoc) throw new HttpException('Tipo de Documento não encontrado', 404);
        }

        const nextVal: any[] = await this.prisma.$queryRaw`select nextval('arquivo_id_seq'::regclass) as id`;

        const arquivoId = Number(nextVal[0].id);

        let key = [
            'uploads',
            createUploadDto.tipo.toLocaleLowerCase(),
            'by-user',
            String(user.id),
            new Date(Date.now()).toISOString(),
            'arquivo-id-' + String(arquivoId),
            file.originalname.replace(/\s/g, '-').replace(/[^\w-\.0-9_]*/gi, '')
        ].join('/');

        await this.storage.putBlob(key, file.buffer, {
            'Content-Type': file.mimetype || 'application/octet-stream',
            'x-user-id': user.id,
            'x-orgao-id': user.orgao_id,
            'x-tipo': createUploadDto.tipo,
            'x-tipo-documento-id': createUploadDto.tipo_documento_id || null,
            'x-uploaded-ip': ip,
        });

        await this.prisma.arquivo.create({
            data: {
                id: arquivoId,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                caminho: key,
                nome_original: file.originalname,
                tamanho_bytes: file.size,
                descricao: createUploadDto.descricao,
                tipo: createUploadDto.tipo,
                tipo_documento_id: createUploadDto.tipo_documento_id,
            },
            select: { id: true }
        });

        return arquivoId;
    }

    async getUploadToken(id: number): Promise<Upload> {
        return {
            upload_token: this.jwtService.sign({
                arquivo_id: id,
                aud: 'upload'
            }, { expiresIn: '30 days' }),
        } as Upload;
    }

    checkUploadToken(token: string): number {
        let decoded: UploadBody | null = null;
        try {
            decoded = this.jwtService.decode(token) as UploadBody;
        } catch (error) {
            console.log(error)
        }
        if (!decoded || decoded.aud != 'upload')
            throw new HttpException('upload_token inválido', 400);

        return decoded.arquivo_id;
    }

    async getDownloadToken(id: number, expiresIn: string): Promise<Download> {
        if (!expiresIn) expiresIn = '10 minutes';

        return {
            download_token: this.jwtService.sign({
                arquivo_id: id,
                aud: 'upload'
            }, { expiresIn }),
        } as Download;
    }

    checkDownloadToken(downloadToken: string): number {

        let decoded: UploadBody | null = null;
        try {
            decoded = this.jwtService.decode(downloadToken) as DownloadBody;
        } catch (error) {
            console.log(error)
        }
        if (!decoded || decoded.aud != 'download')
            throw new HttpException('download_token inválido', 400);

        return decoded.arquivo_id;
    }

    async getBufferByToken(downloadToken: string): Promise<NodeJS.ReadableStream> {
        const arquivo = await this.prisma.arquivo.findFirst({
            where: { id: this.checkDownloadToken(downloadToken) },
            select: { caminho: true }
        });

        if (!arquivo) throw new HttpException('Arquivo não encontrado', 400);

        return await this.storage.getStream(arquivo.caminho);

    }
}
