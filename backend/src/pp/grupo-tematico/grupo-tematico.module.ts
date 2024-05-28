import { Module, forwardRef } from '@nestjs/common';
import { ProjetoModule } from '../projeto/projeto.module';
import { GrupoTematicoController } from './grupo-tematico.controller';
import { GrupoTematicoService } from './grupo-tematico.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule)],
    controllers: [GrupoTematicoController],
    providers: [GrupoTematicoService],
})
export class GrupoTematicoModule {}
