import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PainelExternoController } from './painel.controller';
import { PainelExternoService } from './painel.service';

@Module({
    imports: [PrismaModule],
    controllers: [PainelExternoController],
    providers: [PainelExternoService],
    exports: [PainelExternoService],
})
export class PainelExternoModule {}
