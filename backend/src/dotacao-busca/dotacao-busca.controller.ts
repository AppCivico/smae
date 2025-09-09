import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DotacaoBuscaDto, DotacaoBuscaResponseDto } from './dto/dotacao-busca.dto';
import { DotacaoBuscaService } from './dotacao-busca.service';

@ApiTags('Busca por Dotação')
@ApiBearerAuth('access-token')
@Controller('dotacao-busca')
export class DotacaoBuscaController {
    constructor(private readonly service: DotacaoBuscaService) {}

    @Post()
    @ApiOperation({ summary: 'Busca projetos, obras e PdM/PS por dotação (ou parte dela).' })
    async search(@Body() dto: DotacaoBuscaDto): Promise<DotacaoBuscaResponseDto> {
        return this.service.searchByDotacao(dto);
    }
}
