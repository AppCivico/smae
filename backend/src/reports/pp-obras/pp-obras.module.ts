import { Module, forwardRef } from '@nestjs/common';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PPObrasService } from './pp-obras.service';
import { TarefaModule } from '../../pp/tarefa/tarefa.module';
import { PPObrasController } from './pp-obras.controller';
import { GeoLocModule } from 'src/geo-loc/geo-loc.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => ProjetoModule),
        forwardRef(() => TarefaModule),
        forwardRef(() => GeoLocModule),
    ],
    controllers: [PPObrasController],
    providers: [PPObrasService],
    exports: [PPObrasService],
})
export class PPObrasModule {}
