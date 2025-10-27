import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VinculoService } from './vinculo.service';
import { VinculoController } from './vinculo.controller';
import { SmaeConfigModule } from 'src/common/services/smae-config.module';

@Module({
    imports: [PrismaModule, SmaeConfigModule],
    controllers: [VinculoController],
    providers: [VinculoService],
    exports: [VinculoService],
})
export class VinculoModule {}
