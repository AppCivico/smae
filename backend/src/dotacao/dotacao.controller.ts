import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DotacaoService } from './dotacao.service';
import { DotacaoValorPlanejadoDto } from './dto/dotacao.dto';
import { ValorPlanejadoDto } from './entities/dotacao.entity';

@ApiTags('Orçamento')
@Controller('dotacao')
export class DotacaoController {
    constructor(private readonly dotacaoService: DotacaoService) { }

    @Patch('valor-planejado')
    @ApiBearerAuth('access-token')
    async valorPlanejado(@Body() createDotacaoDto: DotacaoValorPlanejadoDto): Promise<ValorPlanejadoDto> {
        return await this.dotacaoService.valorPlanejado(createDotacaoDto);
    }

}
