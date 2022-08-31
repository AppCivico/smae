import { Module } from '@nestjs/common';
import { RegiaoService } from './regiao.service';
import { RegiaoController } from './regiao.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RegiaoController],
    providers: [RegiaoService]
})
export class RegiaoModule { }
