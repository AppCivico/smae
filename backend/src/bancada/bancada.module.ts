import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BancadaController } from './bancada.controller';
import { BancadaService } from './bancada.service';

@Module({
    imports: [PrismaModule],
    controllers: [BancadaController],
    providers: [BancadaService],
    exports: [BancadaService],
})
export class BancadaModule {}
