import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GrupoPainelExternoController } from './grupo-externo.controller';
import { GrupoPainelExternoService } from './grupo-externo.service';

@Module({
    imports: [PrismaModule],
    controllers: [GrupoPainelExternoController],
    providers: [GrupoPainelExternoService],
})
export class GrupoPainelExternoModule {}
