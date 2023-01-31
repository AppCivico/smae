import { Module } from '@nestjs/common';
import { SubTemaService } from './subtema.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubTemaController } from './subtema.controller';

@Module({
    imports: [PrismaModule],
    controllers: [SubTemaController],
    providers: [SubTemaService],
})
export class SubTemaModule {}
