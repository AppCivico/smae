import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TipoDocumentoController } from './tipo-documento.controller';
import { TipoDocumentoService } from './tipo-documento.service';

@Module({
    imports: [PrismaModule],
    controllers: [TipoDocumentoController],
    providers: [TipoDocumentoService],
})
export class TipoDocumentoModule {}
