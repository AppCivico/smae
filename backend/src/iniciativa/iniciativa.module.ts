import { Module } from '@nestjs/common';
import { IniciativaService } from './iniciativa.service';
import { IniciativaController } from './iniciativa.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IniciativaController],
    providers: [IniciativaService]
})
export class IniciativaModule { }
