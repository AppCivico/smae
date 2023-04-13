import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { RegiaoController } from './regiao.controller';
import { RegiaoService } from './regiao.service';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [RegiaoController],
    providers: [RegiaoService],
})
export class RegiaoModule {}
