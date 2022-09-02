import { Module } from '@nestjs/common';
import { PdmService } from './pdm.service';
import { PdmController } from './pdm.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
    imports: [
        PrismaModule,
        UploadModule
    ],
    controllers: [PdmController],
    providers: [PdmService]
})
export class PdmModule { }
