import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjetoTagController, ProjetoTagMDOController } from './tag.controller';
import { ProjetoTagService } from './tag.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProjetoTagController, ProjetoTagMDOController],
    providers: [ProjetoTagService],
})
export class ProjetoTagModule {}
