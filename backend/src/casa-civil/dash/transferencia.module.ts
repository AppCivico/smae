import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotaModule } from '../../bloco-nota/nota/nota.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransferenciaModule } from '../transferencia/transferencia.module';
import { DashTransferenciaController } from './transferencia.controller';
import { DashTransferenciaService } from './transferencia.service';
import { UploadModule } from 'src/upload/upload.module';

@Module({
    imports: [
        PrismaModule,
        TransferenciaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
        NotaModule,
        UploadModule,
    ],
    controllers: [DashTransferenciaController],
    providers: [DashTransferenciaService],
})
export class DashTransferenciaModule {}
