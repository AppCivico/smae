import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncCadastroBasicoController } from './sync-cadastro-basico.controller';
import { SyncCadastroBasicoService } from './sync-cadastro-basico.service';

@Module({
    imports: [PrismaModule],
    controllers: [SyncCadastroBasicoController],
    providers: [SyncCadastroBasicoService],
})
export class SyncCadastroBasicoModule {}
