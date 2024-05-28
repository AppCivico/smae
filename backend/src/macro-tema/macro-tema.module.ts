import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MacroTemaController, MacroTemaController2, PlanoSetorialMacroTemaController } from './macro-tema.controller';
import { MacroTemaService } from './macro-tema.service';

@Module({
    imports: [PrismaModule],
    controllers: [MacroTemaController, MacroTemaController2, PlanoSetorialMacroTemaController],
    providers: [MacroTemaService],
    exports: [MacroTemaService],
})
export class MacroTemaModule {}
