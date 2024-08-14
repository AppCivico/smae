import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FilterSeiParams, SeiIntegracaoDto } from './entities/sei-entidade.entity';
import { SeiIntegracaoService } from './sei-integracao.service';

@Controller('sei-integracao')
export class SeiIntegracaoController {
    constructor(private readonly sofEntidadeService: SeiIntegracaoService) {}

    @Get('resumo')
    @ApiBearerAuth('access-token')
    async buscaResumo(@Query() params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        return await this.sofEntidadeService.buscaSeiResumo(params);
    }

    @Get('relatorio')
    @ApiBearerAuth('access-token')
    async buscaRelatorio(@Query() params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        return await this.sofEntidadeService.buscaSeiRelatorio(params);
    }
}
