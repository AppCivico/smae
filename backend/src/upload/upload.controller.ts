import { Body, Controller, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { IpAddress } from '../common/decorators/current-ip';
import { CreateUploadDto } from './dto/create-upload.dto';
import { DownloadOptions } from './dto/download-options';
import { Upload } from './entities/upload.entity';
import { UploadService } from './upload.service';

@Controller('')
@ApiTags('Upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @ApiBearerAuth('access-token')
    @UseInterceptors(FileInterceptor('arquivo'))
    async create(
        @Body() createUploadDto: CreateUploadDto,
        @CurrentUser() user: PessoaFromJwt,
        @UploadedFile() file: Express.Multer.File,
        @IpAddress() ipAddress: string): Promise<Upload> {

        const uploadFile = await this.uploadService.upload(createUploadDto, user, file, ipAddress);

        const uploadToken = await this.uploadService.getUploadToken(uploadFile);

        return uploadToken;
    }

    @Get('download/:token')
    @IsPublic()
    @ApiOkResponse({
        description: 'Conteúdo do arquivo',
        type: ''
    })
    async get(
        @Query() filters: DownloadOptions,
        @Param('token') dlToken: string,
        @Res() res: Response
    ) {
        const data = await this.uploadService.getBufferByToken(dlToken);

        if (!filters.inline) {
            res.set({
                'Content-Disposition': 'attachment; filename="' + data.nome.replace(/"/g, '') + '"'
            });
        }
        res.set({
            'Content-Type': data.mime_type
        });

        data.stream.pipe(res);
    }

}
