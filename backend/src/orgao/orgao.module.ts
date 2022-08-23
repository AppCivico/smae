import { Module } from '@nestjs/common';
import { OrgaoService } from './orgao.service';
import { OrgaoController } from './orgao.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [OrgaoController],
    providers: [OrgaoService]
})
export class OrgaoModule { }
