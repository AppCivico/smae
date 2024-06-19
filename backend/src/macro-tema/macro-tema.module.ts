import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MacroTemaController, PlanoSetorialMacroTemaController } from './macro-tema.controller';
import { MacroTemaService } from './macro-tema.service';

@Module({
    imports: [PrismaModule],
    controllers: [ MacroTemaController, PlanoSetorialMacroTemaController],
    providers: [MacroTemaService],
    exports: [MacroTemaService],
})
export class MacroTemaModule {}
