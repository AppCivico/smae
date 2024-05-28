import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TemaController, TemaController2 } from './tema.controller';
import { TemaService } from './tema.service';

@Module({
    imports: [PrismaModule],
    controllers: [TemaController, TemaController2],
    providers: [TemaService],
    exports: [TemaService],
})
export class TemaModule {}
