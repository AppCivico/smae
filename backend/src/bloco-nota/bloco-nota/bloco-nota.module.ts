import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BlocoNotaService } from './bloco-nota.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':bloco',
            signOptions: {},
        }),
    ],
    providers: [BlocoNotaService],
    exports: [BlocoNotaService],
})
export class BlocoNotaModule {}
