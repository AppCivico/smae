import { Module, forwardRef } from '@nestjs/common';
import { ProjetoModule } from '../projeto/projeto.module';
import { EquipamentoController } from './equipamento.controller';
import { EquipamentoService } from './equipamento.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule)],
    controllers: [EquipamentoController],
    providers: [EquipamentoService],
})
export class EquipamentoModule {}
