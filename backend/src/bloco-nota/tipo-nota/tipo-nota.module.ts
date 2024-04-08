import { Module } from '@nestjs/common';
import { TipoNotaController } from './tipo-nota.controller';
import { TipoNotaService } from './tipo-nota.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TipoNotaController],
    providers: [TipoNotaService],
    exports: [TipoNotaService],
})
export class TipoNotaModule {}
