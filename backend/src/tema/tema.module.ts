import { Module, forwardRef } from '@nestjs/common';
import { PdmModule } from '../pdm/pdm.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TemaController, TemaControllerPS } from './tema.controller';
import { TemaService } from './tema.service';

@Module({
    imports: [PrismaModule, forwardRef(() => PdmModule)],
    controllers: [TemaController, TemaControllerPS],
    providers: [TemaService],
    exports: [TemaService],
})
export class TemaModule {}
