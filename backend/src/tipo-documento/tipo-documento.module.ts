import { Module } from '@nestjs/common';
import { TipoDocumentoService } from './tipo-documento.service';
import { TipoDocumentoController } from './tipo-documento.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TipoDocumentoController],
    providers: [TipoDocumentoService]
})
export class TipoDocumentoModule { }
