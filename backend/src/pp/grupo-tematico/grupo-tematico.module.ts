import { Module } from '@nestjs/common';
import { GrupoTematicoController } from './grupo-tematico.controller';
import { GrupoTematicoService } from './grupo-tematico.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GrupoTematicoController],
    providers: [GrupoTematicoService],
})
export class GrupoTematicoModule {}
