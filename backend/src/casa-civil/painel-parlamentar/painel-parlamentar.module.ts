import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ParlamentarModule } from 'src/parlamentar/parlamentar.modules';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { PainelParlamentarController } from './painel-parlamentar.controller';
import { PainelParlamentarService } from './painel-parlamentar.service';

@Module({
    imports: [
        PrismaModule,
        UploadModule,
        ParlamentarModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [PainelParlamentarController],
    providers: [PainelParlamentarService],
})
export class PainelParlamentarModule {}
