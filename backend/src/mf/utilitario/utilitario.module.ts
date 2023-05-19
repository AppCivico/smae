import { Module, forwardRef } from '@nestjs/common';
import { UtilitarioService } from './utilitario.service';
import { UtilitarioController } from './utilitario.controller';
import { MetasModule } from '../metas/metas.module';
import { MfModule } from '../mf.module';

@Module({
    imports: [
        forwardRef(() => MetasModule),
        forwardRef(() => MfModule),
    ],
    controllers: [UtilitarioController],
    providers: [UtilitarioService]
})
export class UtilitarioModule { }
