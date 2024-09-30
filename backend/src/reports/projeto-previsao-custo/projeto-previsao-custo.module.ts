import { Module } from '@nestjs/common';
import { PrevisaoCustoModule } from '../previsao-custo/previsao-custo.module';
import { ProjetoMDOPrevisaoCustoController, ProjetoPrevisaoCustoController } from './projeto-previsao-custo.controller';

@Module({
    imports: [PrevisaoCustoModule],
    controllers: [ProjetoPrevisaoCustoController, ProjetoMDOPrevisaoCustoController],
})
export class ReportProjetoPrevisaoCustoModule {}
