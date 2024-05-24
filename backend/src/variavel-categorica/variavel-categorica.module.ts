import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelCategoricaController } from './variavel-categorica.controller';
import { VariavelCategoricaService } from './variavel-categorica.service';

@Module({
    imports: [PrismaModule],
    controllers: [VariavelCategoricaController],
    providers: [VariavelCategoricaService],
    exports: [VariavelCategoricaService],
})
export class VariavelCategoricaModule {}
