import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ParlamentaresController } from './parlamentares.controller';
import { ParlamentaresService } from './parlamentares.service';
import { ParlamentarModule } from 'src/parlamentar/parlamentar.modules';

@Module({
    imports: [PrismaModule, forwardRef(() => ParlamentarModule)],
    controllers: [ParlamentaresController],
    providers: [ParlamentaresService],
    exports: [ParlamentaresService],
})
export class ParlamentaresModule {}
