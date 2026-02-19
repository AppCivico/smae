import { Controller, Get, HttpException, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { UploadService } from './upload.service';

@ApiTags('Publico - Arquivos')
@Controller('public/arquivos')
export class PublicUploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Get(':token')
    @IsPublic()
    async download(@Param('token') token: string, @Res() res: Response) {
        try {
            const arquivoId = this.uploadService.checkPublicToken(token);
            const arquivo = await this.uploadService.getReadableStreamById(arquivoId);

            res.setHeader('Content-Type', arquivo.mime_type);
            res.setHeader('Content-Disposition', `inline; filename="${arquivo.nome}"`);
            arquivo.stream.pipe(res);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException('Falha ao baixar arquivo', 500);
        }
    }
}
