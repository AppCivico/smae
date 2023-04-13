import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UnidadeMedidaController } from './unidade-medida.controller';
import { UnidadeMedidaService } from './unidade-medida.service';

@Module({
    imports: [PrismaModule],
    controllers: [UnidadeMedidaController],
    providers: [UnidadeMedidaService],
})
export class UnidadeMedidaModule {}
