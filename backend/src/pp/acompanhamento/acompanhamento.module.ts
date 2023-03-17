import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AcompanhamentoController } from './acompanhamento.controller';
import { AcompanhamentoService } from './acompanhamento.service';

@Module({
    imports: [PrismaModule],
    controllers: [AcompanhamentoController],
    providers: [AcompanhamentoService]
})
export class AcompanhamentoModule { }
