import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LicoesAprendidasController } from './licoes-aprendidas.controller';
import { LicoesAprendidasService } from './licoes-aprendidas.service';

@Module({
    imports: [PrismaModule],
    controllers: [LicoesAprendidasController],
    providers: [LicoesAprendidasService]
})
export class LicoesAprendidasModule { }
