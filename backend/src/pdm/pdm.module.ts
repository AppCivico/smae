import { Module } from '@nestjs/common';
import { PdmService } from './pdm.service';
import { PdmController } from './pdm.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PdmController],
    providers: [PdmService]
})
export class PdmModule { }
