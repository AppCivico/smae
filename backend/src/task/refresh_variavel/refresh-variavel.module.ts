import { Module } from '@nestjs/common';
import { RefreshVariavelService } from './refresh-variavel.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [RefreshVariavelService],
    exports: [RefreshVariavelService],
})
export class RefreshVariavelModule {}
