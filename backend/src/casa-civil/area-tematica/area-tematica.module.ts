import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AreaTematicaController } from './area-tematica.controller';
import { AreaTematicaService } from './area-tematica.service';

@Module({
    imports: [PrismaModule],
    controllers: [AreaTematicaController],
    providers: [AreaTematicaService],
    exports: [AreaTematicaService],
})
export class AreaTematicaModule {}
