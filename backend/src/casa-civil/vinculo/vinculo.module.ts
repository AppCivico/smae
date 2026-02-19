import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VinculoService } from './vinculo.service';
import { VinculoController } from './vinculo.controller';
import { SmaeConfigModule } from 'src/common/services/smae-config.module';
import { DemandaModule } from '../demanda/demanda.module';

@Module({
    imports: [PrismaModule, SmaeConfigModule, forwardRef(() => DemandaModule)],
    controllers: [VinculoController],
    providers: [VinculoService],
    exports: [VinculoService],
})
export class VinculoModule {}
