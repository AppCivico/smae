import { Module } from '@nestjs/common';
import { UnidadeMedidaService } from './unidade-medida.service';
import { UnidadeMedidaController } from './unidade-medida.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UnidadeMedidaController],
    providers: [UnidadeMedidaService]
})
export class UnidadeMedidaModule { }
