import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ParlamentarController } from './parlamentar.controller';
import { ParlamentarService } from './parlamentar.service';

@Module({
    imports: [PrismaModule],
    controllers: [ParlamentarController],
    providers: [ParlamentarService],
    exports: [ParlamentarService],
})
export class ParlamentarModule {}
