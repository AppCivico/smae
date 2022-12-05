import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DotacaoService } from './dotacao.service';
import { AnoDotacaoDto } from './dto/dotacao.dto';
import { ListValorRealizadoDotacaoDto, ValorPlanejadoDto } from './entities/dotacao.entity';

@ApiTags('Orçamento')
@Controller('dotacao')
export class DotacaoController {
    constructor(private readonly dotacaoService: DotacaoService) { }

    @Patch('valor-planejado')
    @ApiBearerAuth('access-token')
    async valorPlanejado(@Body() createDotacaoDto: AnoDotacaoDto): Promise<ValorPlanejadoDto> {
        return await this.dotacaoService.valorPlanejado(createDotacaoDto);
    }

    @Patch('valor-realizado')
    @ApiBearerAuth('access-token')
    async valorRealizadoDotacao(@Body() createDotacaoDto: AnoDotacaoDto): Promise<ListValorRealizadoDotacaoDto> {
        return {
            linhas: await this.dotacaoService.valorRealizadoDotacao(createDotacaoDto)
        }
    }

}
