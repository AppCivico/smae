import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
    AtivarDesativarSeiDto,
    FilterSeiListParams,
    FilterSeiParams,
    SeiIntegracaoDto,
} from './entities/sei-entidade.entity';
import { SeiIntegracaoService } from './sei-integracao.service';
import { PaginatedDto } from '../common/dto/paginated.dto';
import { ApiPaginatedResponse } from '../auth/decorators/paginated.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';

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
    @ApiPaginatedResponse(SeiIntegracaoDto)
    async listaProcessos(@Query() params: FilterSeiListParams): Promise<PaginatedDto<SeiIntegracaoDto>> {
        return await this.seiIntegracaoService.listaProcessos(params);
    }

    @Post('ativar-desativar')
    @ApiBearerAuth('access-token')
    async ativarDesativarProcessos(@Body() params: AtivarDesativarSeiDto) {
        await this.seiIntegracaoService.atualizaStatusAtivo(params.processos_sei, params.ativo);
        return { message: 'Processos atualizados com sucesso' };
    }

    @Post('sync-distribuicao-recurso-sei')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    async syncDistribuicaoRecursoSEI() {
        await this.seiIntegracaoService.syncDistribuicaoRecursoSEI();
        return { message: 'Sincronização de distribuição de recurso concluída' };
    }
}
