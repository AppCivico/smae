import { Module } from '@nestjs/common';
import { IniciativaService } from './iniciativa.service';
import { IniciativaController } from './iniciativa.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VariavelModule } from 'src/variavel/variavel.module';

@Module({
    imports: [PrismaModule, VariavelModule],
    controllers: [IniciativaController],
    providers: [IniciativaService]
})
export class IniciativaModule { }
