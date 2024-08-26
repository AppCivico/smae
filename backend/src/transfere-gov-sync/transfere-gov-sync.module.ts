import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BlocoNotaModule } from '../bloco-nota/bloco-nota/bloco-nota.module';
import { NotaModule } from '../bloco-nota/nota/nota.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TransfereGovApiModule } from '../transfere-gov-api/transfere-gov-api.module';
import { TransfereGovController } from './transfere-gov-sync.controller';
import { TransfereGovSyncService } from './transfere-gov-sync.service';

@Module({
    imports: [
        PrismaModule,
        TransfereGovApiModule,
        BlocoNotaModule,
        NotaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [TransfereGovController],
    providers: [TransfereGovSyncService],
    exports: [TransfereGovSyncService],
})
export class TransfereGovSyncModule {}
