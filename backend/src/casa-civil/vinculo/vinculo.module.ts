import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VinculoService } from './vinculo.service';
import { VinculoController } from './vinculo.controller';

@Module({
    imports: [PrismaModule],
    controllers: [VinculoController],
    providers: [VinculoService],
    exports: [VinculoService],
})
export class VinculoModule {}
