import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PainelExternoController } from './painel-externo.controller';
import { PainelExternoService } from './painel-externo.service';

@Module({
    imports: [PrismaModule],
    controllers: [PainelExternoController],
    providers: [PainelExternoService],
    exports: [PainelExternoService],
})
export class PainelExternoModule {}
