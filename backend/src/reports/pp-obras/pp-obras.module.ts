import { Module, forwardRef } from '@nestjs/common';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PPObrasService } from './pp-obras.service';
import { TarefaModule } from '../../pp/tarefa/tarefa.module';
import { PPObrasController } from './pp-obras.controller';
import { GeoLocService } from 'src/geo-loc/geo-loc.service';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => ProjetoModule),
        forwardRef(() => TarefaModule),
        forwardRef(() => GeoLocService),
    ],
    controllers: [PPObrasController],
    providers: [PPObrasService],
    exports: [PPObrasService],
})
export class PPObrasModule {}
