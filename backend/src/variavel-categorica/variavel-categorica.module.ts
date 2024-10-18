import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelCategoricaController } from './variavel-categorica.controller';
import { VariavelCategoricaService } from './variavel-categorica.service';
import { VariavelModule } from '../variavel/variavel.module';

@Module({
    imports: [PrismaModule, forwardRef(() => VariavelModule)],
    controllers: [VariavelCategoricaController],
    providers: [VariavelCategoricaService],
    exports: [VariavelCategoricaService],
})
export class VariavelCategoricaModule {}
