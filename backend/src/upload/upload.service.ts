import { ReadStream } from 'fs';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/upload/storage-service';
import { CreateUploadDto } from './dto/create-upload.dto';


@Injectable()
export class UploadService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) { }

    async upload(createUploadDto: CreateUploadDto, user: PessoaFromJwt, file: Express.Multer.File) {

        console.log(file)
        const r = await this.storage.putBlob('test', file.buffer, {
            'Content-Type': 'application/octet-stream',

        });

        console.log(r)
        //await new Promise(r => setTimeout(r, 100));

        //console.log(r)
        return 'yay';

    }

}
