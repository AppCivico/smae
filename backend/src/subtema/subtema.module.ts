import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubTemaController } from './subtema.controller';
import { SubTemaService } from './subtema.service';

@Module({
    imports: [PrismaModule],
    controllers: [SubTemaController],
    providers: [SubTemaService],
    exports: [SubTemaService],
})
export class SubTemaModule {}
