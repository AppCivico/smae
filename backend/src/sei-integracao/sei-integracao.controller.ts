import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
    AtivarDesativarSeiDto,
    FilterSeiListParams,
    FilterSeiParams,
    SeiIntegracaoDto,
} from './entities/sei-entidade.entity';
import { SeiIntegracaoService } from './sei-integracao.service';
import { PaginatedDto } from '../common/dto/paginated.dto';

@Controller('sei-integracao')
@ApiTags('SEI Integração')
export class SeiIntegracaoController {
    constructor(private readonly seiIntegracaoService: SeiIntegracaoService) {}

    @Get('resumo')
    @ApiBearerAuth('access-token')
    async buscaResumo(@Query() params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        return await this.seiIntegracaoService.buscaSeiResumo(params);
    }

    @Get('relatorio')
    @ApiBearerAuth('access-token')
    async buscaRelatorio(@Query() params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        return await this.seiIntegracaoService.buscaSeiRelatorio(params);
    }

    @Get('lista')
    @ApiBearerAuth('access-token')
    @ApiQuery({ type: FilterSeiListParams })
    async listaProcessos(@Query() params: FilterSeiListParams): Promise<PaginatedDto<SeiIntegracaoDto>> {
        return await this.seiIntegracaoService.listaProcessos(params);
    }

    @Post('ativar-desativar')
    @ApiBearerAuth('access-token')
    async ativarDesativarProcessos(@Body() params: AtivarDesativarSeiDto) {
        await this.seiIntegracaoService.atualizaStatusAtivo(params.processos_sei, params.ativo);
        return { message: 'Processos atualizados com sucesso' };
    }
}
