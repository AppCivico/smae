import { Module } from '@nestjs/common';
import { SofEntidadeService } from './sof-entidade.service';
import { SofEntidadeController } from './sof-entidade.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SofApiModule } from '../sof-api/sof-api.module';

@Module({
    imports: [PrismaModule, SofApiModule],
    controllers: [SofEntidadeController],
    providers: [SofEntidadeService],
})
export class SofEntidadeModule {}
