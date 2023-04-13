import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IniciativaController } from './iniciativa.controller';
import { IniciativaService } from './iniciativa.service';

@Module({
    imports: [PrismaModule, VariavelModule],
    controllers: [IniciativaController],
    providers: [IniciativaService],
})
export class IniciativaModule {}
