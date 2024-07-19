import { Module } from '@nestjs/common';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IniciativaController, IniciativaSetorialController } from './iniciativa.controller';
import { IniciativaService } from './iniciativa.service';

@Module({
    imports: [PrismaModule, MetaModule, VariavelModule],
    controllers: [IniciativaController, IniciativaSetorialController],
    providers: [IniciativaService],
})
export class IniciativaModule {}
