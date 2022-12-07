import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PainelController } from './painel.controller';
import { PainelService } from './painel.service';

@Module({
    imports: [PrismaModule],
    controllers: [PainelController],
    providers: [PainelService]
})
export class PainelModule { }
