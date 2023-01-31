import { Module } from '@nestjs/common';
import { IniciativaService } from './iniciativa.service';
import { IniciativaController } from './iniciativa.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';

@Module({
    imports: [PrismaModule, VariavelModule],
    controllers: [IniciativaController],
    providers: [IniciativaService],
})
export class IniciativaModule {}
