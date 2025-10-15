import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DotacaoBuscaDto, DotacaoBuscaResponseDto } from './dto/dotacao-busca.dto';
import { DotacaoBuscaService } from './dotacao-busca.service';

@ApiTags('Busca por Dotação')
@ApiBearerAuth('access-token')
@Controller('dotacao-busca')
export class DotacaoBuscaController {
    constructor(private readonly service: DotacaoBuscaService) {}

    @Get()
    @ApiOperation({ summary: 'Busca projetos, obras e PdM/PS por dotação (ou parte dela).' })
    @ApiQuery({
        name: 'query',
        required: true,
        description: 'Dotação ou parte dela',
        example: '16.10.12.128.3011.2.180.33903600.00',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Máximo de registros retornados por bloco',
        schema: { type: 'number', default: 200 },
    })
    @ApiQuery({
        name: 'somenteAtivos',
        required: false,
        description: 'Filtrar apenas entidades ativas',
        schema: { type: 'boolean', default: true },
    })
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: DotacaoBuscaResponseDto })
    async search(@Query() dto: DotacaoBuscaDto): Promise<DotacaoBuscaResponseDto> {
        return this.service.searchByDotacao(dto);
    }
}
