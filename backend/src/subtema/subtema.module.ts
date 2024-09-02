import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlanoSetorialSubTemaController, SubTemaController } from './subtema.controller';
import { SubTemaService } from './subtema.service';
import { PdmModule } from '../pdm/pdm.module';

@Module({
    imports: [PrismaModule, forwardRef(() => PdmModule)],
    controllers: [SubTemaController, PlanoSetorialSubTemaController],
    providers: [SubTemaService],
    exports: [SubTemaService],
})
export class SubTemaModule {}
