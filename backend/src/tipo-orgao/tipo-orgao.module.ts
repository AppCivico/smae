import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TipoOrgaoController } from './tipo-orgao.controller';
import { TipoOrgaoService } from './tipo-orgao.service';

@Module({
    imports: [PrismaModule],
    controllers: [TipoOrgaoController],
    providers: [TipoOrgaoService],
})
export class TipoOrgaoModule {}
