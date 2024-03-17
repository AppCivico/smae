import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TransferenciaService } from './transferencia.service';
import { TransferenciaTipoController } from './transferencia-tipo.controller';
import { TransferenciaController } from './transferencia.controller';
import { UploadModule } from 'src/upload/upload.module';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [TransferenciaController, TransferenciaTipoController],
    providers: [TransferenciaService],
    exports: [TransferenciaService],
})
export class TransferenciaModule {}
