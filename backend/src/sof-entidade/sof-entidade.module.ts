import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SofApiModule } from '../sof-api/sof-api.module';
import { SofEntidadeController } from './sof-entidade.controller';
import { SofEntidadeService } from './sof-entidade.service';

@Module({
    imports: [PrismaModule, SofApiModule],
    controllers: [SofEntidadeController],
    providers: [SofEntidadeService],
})
export class SofEntidadeModule {}
