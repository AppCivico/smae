import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TipoVinculoController } from './tipo-vinculo.controller';
import { TipoVinculoService } from './tipo-vinculo.service';

@Module({
    imports: [PrismaModule],
    controllers: [TipoVinculoController],
    providers: [TipoVinculoService],
    exports: [TipoVinculoService],
})
export class TipoVinculoModule {}
