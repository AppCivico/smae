import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CicloFisicoController } from './ciclo-fisico.controller';
import { CicloFisicoService } from './ciclo-fisico.service';

@Module({
    imports: [PrismaModule],
    controllers: [CicloFisicoController],
    providers: [CicloFisicoService]
})
export class CicloFisicoModule { }
