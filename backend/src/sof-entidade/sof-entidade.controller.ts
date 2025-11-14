import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FindAnoParams } from '../common/decorators/find-params';
import { SofDetalhamentoFonteDto, SofEntidadeDto } from './entities/sof-entidade.entity';
import { SofEntidadeService } from './sof-entidade.service';

@Controller('sof-entidade')
export class SofEntidadeController {
    constructor(private readonly sofEntidadeService: SofEntidadeService) {}

    @Get(':ano')
    @ApiBearerAuth('access-token')
    @Header('Cache-Control', 'max-age=3600')
    @ApiOperation({
        summary:
            'Dados do ano corrente são atualizados diariamente, resposta pode ser salva em storage local por ate 24h',
    })
    async findByYear(@Param() params: FindAnoParams): Promise<SofEntidadeDto> {
        return (await this.sofEntidadeService.findByYear(+params.ano)) as any as SofEntidadeDto;
    }

    @Get(':ano/detalhamento/:numeroFonte')
    @ApiBearerAuth('access-token')
    @Header('Cache-Control', 'max-age=3600')
    @ApiOperation({
        summary:
            'Dados do ano corrente são atualizados diariamente, resposta pode ser salva em storage local por ate 24h',
    })
    async detalhamentoFonte(
        @Param('ano') ano: number,
        @Param('numeroFonte') numeroFonte: number
    ): Promise<SofDetalhamentoFonteDto> {
        return (await this.sofEntidadeService.findDetalhamentoFonte(
            +ano,
            +numeroFonte
        )) as unknown as SofDetalhamentoFonteDto;
    }
}
