import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { LicoesAprendidasController } from './licoes-aprendidas.controller';
import { LicoesAprendidasService } from './licoes-aprendidas.service';

@Module({
    imports: [PrismaModule, ProjetoModule],
    controllers: [LicoesAprendidasController],
    providers: [LicoesAprendidasService],
})
export class LicoesAprendidasModule {}
