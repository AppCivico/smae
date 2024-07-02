import { Module } from '@nestjs/common';
import { ProjetoProgramaService } from './programa.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ProjetoProgramaMDOController } from './programa.controller';

@Module({
    imports: [PrismaModule],
    controllers: [ProjetoProgramaMDOController],
    providers: [ProjetoProgramaService],
})
export class ProjetoProgramaModule {}
