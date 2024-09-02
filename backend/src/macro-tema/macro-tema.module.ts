import { Module, forwardRef } from '@nestjs/common';
import { PdmModule } from '../pdm/pdm.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MacroTemaController, PlanoSetorialMacroTemaController } from './macro-tema.controller';
import { MacroTemaService } from './macro-tema.service';

@Module({
    imports: [PrismaModule, forwardRef(() => PdmModule)],
    controllers: [MacroTemaController, PlanoSetorialMacroTemaController],
    providers: [MacroTemaService],
    exports: [MacroTemaService],
})
export class MacroTemaModule {}
