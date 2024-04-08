import { Module } from '@nestjs/common';
import { NotaController } from './nota.controller';
import { NotaService } from './nota.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { BlocoNotaModule } from '../bloco-nota/bloco-nota.module';
import { TipoNotaModule } from '../tipo-nota/tipo-nota.module';

@Module({
    imports: [
        PrismaModule,
        BlocoNotaModule,
        TipoNotaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':nota',
            signOptions: {},
        }),
    ],
    controllers: [NotaController],
    providers: [NotaService],
    exports: [NotaService],
})
export class NotaModule {}
