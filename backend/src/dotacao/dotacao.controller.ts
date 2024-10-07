import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DotacaoProcessoNotaService } from './dotacao-processo-nota.service';
import { DotacaoProcessoService } from './dotacao-processo.service';
import { DotacaoService } from './dotacao.service';
import { AnoDotacaoDto, AnoDotacaoNotaEmpenhoDto, AnoDotacaoProcessoDto } from './dto/dotacao.dto';
import {
    ListValorRealizadoDotacaoDto,
    ListValorRealizadoNotaEmpenhoDto,
    ListValorRealizadoProcessoDto,
    ValorPlanejadoDto,
} from './entities/dotacao.entity';

const summary = 'Consulta SOF para receber empenho e liquidação para incluir Orçamento Realizado';

// o controller de dotação só verifica se o usuário está autenticado,
// mas não confere se tem os privilégios de orçamento, como ele é apenas read-only
// não tem muito problema qualquer usuário fazer chamadas nele
@Controller('dotacao')
export class DotacaoController {
    constructor(
        private readonly dotacaoService: DotacaoService,
        private readonly processoService: DotacaoProcessoService,
        private readonly notaEmpenhoService: DotacaoProcessoNotaService
    ) {}

    @ApiTags('Orçamento - Planejado')
    @ApiOperation({
        summary:
            'Consulta SOF para receber empenho para incluir Orçamento Planejado (proxy para v1/orcado/orcado_dotacao)',
        description:
            'Realiza a busca e cache dos dados da dotação, utilizando sempre o mês de janeiro como referencia para o empenho.\n\n' +
            'Caso o SOF esteja com problemas (offline), ainda é salvo um registro, onde preenchimento do planejado poderá ser utilizado\n\n' +
            'Neste caso, deve-se chamar novamente este serviço para que o calculo da pressão orçamentaria seja feito com os dados reais. **Não há processo em background para retentavas ou buscar atualizações**',
    })
    @Patch('valor-planejado')
    @ApiBearerAuth('access-token')
    async valorPlanejado(@Body() createDotacaoDto: AnoDotacaoDto): Promise<ValorPlanejadoDto> {
        return await this.dotacaoService.valorPlanejado(createDotacaoDto);
    }

    @ApiTags('Orçamento - Realizado')
    @Patch('valor-realizado')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary,
        description:
            'Realiza a busca e cache dos dados da dotação, utilizando sempre o mês mais atualizado possível.\n\n' +
            'Caso o SOF esteja com problemas (offline), não será possível utilizar a função de Orçamento Realizado\n\n' +
            '**Retorna sempre apenas uma linha**',
    })
    async valorRealizadoDotacao(@Body() createDotacaoDto: AnoDotacaoDto): Promise<ListValorRealizadoDotacaoDto> {
        return {
            linhas: await this.dotacaoService.valorRealizadoDotacao(createDotacaoDto),
        };
    }

    @ApiTags('Orçamento - Realizado')
    @Patch('valor-realizado-processo')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary,
        description:
            'Realiza a busca e cache dos dados de dotação a partir do Processo SEI, utilizando sempre o mês mais atualizado possível.\n\n' +
            'Caso o SOF esteja com problemas (offline), não será possível utilizar a função de Orçamento Realizado\n\n' +
            '**Retorna mais de uma linha, todas as dotações ficam disponíveis para utilizar no Orçamento Realizado**',
    })
    async valorRealizadoDotacaoProcesso(@Body() dto: AnoDotacaoProcessoDto): Promise<ListValorRealizadoProcessoDto> {
        return {
            linhas: await this.processoService.valorRealizadoProcesso(dto),
        };
    }

    @ApiTags('Orçamento - Realizado')
    @Patch('valor-realizado-nota-empenho')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary,
        description:
            'Realiza a busca e cache dos dados de dotação a partir da Nota de Empenho, utilizando sempre o mês mais atualizado possível.\n\n' +
            'Caso o SOF esteja com problemas (offline), não será possível utilizar a função de Orçamento Realizado\n\n' +
            '**Retorna sempre apenas uma linha, se voltar mais de uma no SOF, retorna erro 400**',
    })
    async valorRealizadoDotacaoNotaEmpenho(
        @Body() dto: AnoDotacaoNotaEmpenhoDto
    ): Promise<ListValorRealizadoNotaEmpenhoDto> {
        return {
            linhas: await this.notaEmpenhoService.valorRealizadoNotaEmpenho(dto),
        };
    }
}
