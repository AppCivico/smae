import { Module } from '@nestjs/common';
import { WikiLinkController } from './wiki-link.controller';
import { WikiLinkService } from './wiki-link.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    controllers: [WikiLinkController],
    providers: [WikiLinkService],
    imports: [PrismaModule],
})
export class WikiLinkModule {}
