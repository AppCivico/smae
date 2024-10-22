import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VariavelModule } from '../../variavel/variavel.module';
import { RefreshVariavelService } from './refresh-variavel.service';

@Module({
    imports: [PrismaModule, VariavelModule],
    providers: [RefreshVariavelService],
    exports: [RefreshVariavelService],
})
export class RefreshVariavelModule {}
