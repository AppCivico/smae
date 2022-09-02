import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, StreamableFile, Res } from '@nestjs/common';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { IpAddress } from 'src/common/decorators/current-ip';
import { Upload } from 'src/upload/entities/upload.entity';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { Stream } from 'stream';
import { createReadStream } from 'fs';
import { Response } from 'express';

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
        @CurrentUser() user: PessoaFromJwt,
        @Param('token') dlToken: string,
        @Res() res: Response
    ) {
        (await this.uploadService.getBufferByToken(dlToken)).pipe(res)
    }

}
