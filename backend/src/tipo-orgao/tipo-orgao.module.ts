import { Module } from '@nestjs/common';
import { TipoOrgaoService } from './tipo-orgao.service';
import { TipoOrgaoController } from './tipo-orgao.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TipoOrgaoController],
    providers: [TipoOrgaoService],
})
export class TipoOrgaoModule {}
