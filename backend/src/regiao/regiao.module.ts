import { Module } from '@nestjs/common';
import { RegiaoService } from './regiao.service';
import { RegiaoController } from './regiao.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [RegiaoController],
    providers: [RegiaoService]
})
export class RegiaoModule { }
