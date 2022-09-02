import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('upload')
@ApiTags('Upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @UseInterceptors(FileInterceptor('arquivo'))
    create(
        @Body() createUploadDto: CreateUploadDto,
        user: PessoaFromJwt,
        @UploadedFile() file: Express.Multer.File) {

            //heapdump.writeSnapshot('/tmp/' + Date.now() + '.heapsnapshot');


        return this.uploadService.upload(createUploadDto, user, file);
    }


}
