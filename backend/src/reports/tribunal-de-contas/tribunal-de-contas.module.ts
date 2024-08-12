import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TribunalDeContasController } from './tribunal-de-contas.controller';
import { TribunalDeContasService } from './tribunal-de-contas.service';

@Module({
    imports: [PrismaModule],
    controllers: [TribunalDeContasController],
    providers: [TribunalDeContasService],
    exports: [TribunalDeContasService],
})
export class TribunalDeContasModule {}
