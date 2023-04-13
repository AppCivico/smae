import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrgaoController } from './orgao.controller';
import { OrgaoService } from './orgao.service';

@Module({
    imports: [PrismaModule],
    controllers: [OrgaoController],
    providers: [OrgaoService],
})
export class OrgaoModule {}
