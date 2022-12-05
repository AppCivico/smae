import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DotacaoProcessoNotaService } from './dotacao-processo-nota.service';
import { DotacaoProcessoService } from './dotacao-processo.service';
import { DotacaoService } from './dotacao.service';
import { AnoDotacaoDto, AnoDotacaoNotaEmpenhoDto, AnoDotacaoProcessoDto } from './dto/dotacao.dto';
import { ListValorRealizadoDotacaoDto, ListValorRealizadoNotaEmpenhoDto, ListValorRealizadoProcessoDto, ValorPlanejadoDto } from './entities/dotacao.entity';

@ApiTags('Orçamento')
@Controller('dotacao')
export class DotacaoController {
    constructor(
        private readonly dotacaoService: DotacaoService,
        private readonly processoService: DotacaoProcessoService,
        private readonly notaEmpenhoService: DotacaoProcessoNotaService,

    ) { }

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

    @Patch('valor-realizado-processo')
    @ApiBearerAuth('access-token')
    async valorRealizadoDotacaoProcesso(@Body() dto: AnoDotacaoProcessoDto): Promise<ListValorRealizadoProcessoDto> {
        return {
            linhas: await this.processoService.valorRealizadoProcesso(dto)
        }
    }

    @Patch('valor-realizado-nota-empenho')
    @ApiBearerAuth('access-token')
    async valorRealizadoDotacaoNotaEmpenho(@Body() dto: AnoDotacaoNotaEmpenhoDto): Promise<ListValorRealizadoNotaEmpenhoDto> {
        return {
            linhas: await this.notaEmpenhoService.valorRealizadoNotaEmpenho(dto)
        }
    }

}
