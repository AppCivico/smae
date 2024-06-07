import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ParlamentarController } from './parlamentar.controller';
import { ParlamentarService } from './parlamentar.service';
import { UploadModule } from 'src/upload/upload.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [PrismaModule, UploadModule, JwtModule],
    controllers: [ParlamentarController],
    providers: [ParlamentarService],
    exports: [ParlamentarService],
})
export class ParlamentarModule {}
