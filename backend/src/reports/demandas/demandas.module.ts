import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DemandasController } from './demandas.controller';
import { DemandasService } from './demandas.service';

@Module({
    imports: [PrismaModule],
    controllers: [DemandasController],
    providers: [DemandasService],
    exports: [DemandasService],
})
export class DemandasModule {}
