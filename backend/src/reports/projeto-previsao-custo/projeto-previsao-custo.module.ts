import { Module } from '@nestjs/common';
import { PrevisaoCustoModule } from '../previsao-custo/previsao-custo.module';
import { ProjetoPrevisaoCustoController } from './projeto-previsao-custo.controller';

@Module({
    imports: [PrevisaoCustoModule],
    controllers: [ProjetoPrevisaoCustoController],
})
export class ProjetoPrevisaoCustoModule {}
