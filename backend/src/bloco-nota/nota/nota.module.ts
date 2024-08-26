import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { BlocoNotaModule } from '../bloco-nota/bloco-nota.module';
import { TipoNotaModule } from '../tipo-nota/tipo-nota.module';
import { NotaComunicadoController } from './comunicado.controller';
import { NotaController } from './nota.controller';
import { NotaService } from './nota.service';

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
    controllers: [NotaController, NotaComunicadoController],
    providers: [NotaService],
    exports: [NotaService],
})
export class NotaModule {}
