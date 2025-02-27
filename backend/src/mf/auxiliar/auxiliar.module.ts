import { Module, forwardRef } from '@nestjs/common';
import { MonitMetasModule } from '../metas/metas.module';
import { MfModule } from '../mf.module';
import { AuxiliarController } from './auxiliar.controller';
import { AuxiliarService } from './auxiliar.service';

@Module({
    imports: [forwardRef(() => MonitMetasModule), forwardRef(() => MfModule)],
    controllers: [AuxiliarController],
    providers: [AuxiliarService],
})
export class AuxiliarModule {}
