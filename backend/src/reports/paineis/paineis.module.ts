import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaineisController } from './paineis.controller';
import { PaineisService } from './paineis.service';

@Module({
    imports: [PrismaModule],
    controllers: [PaineisController],
    providers: [PaineisService],
    exports: [PaineisService],
})
export class PaineisModule { }
