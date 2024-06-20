import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TemaController, TemaControllerPS } from './tema.controller';
import { TemaService } from './tema.service';

@Module({
    imports: [PrismaModule],
    controllers: [TemaController, TemaControllerPS],
    providers: [TemaService],
    exports: [TemaService],
})
export class TemaModule {}
