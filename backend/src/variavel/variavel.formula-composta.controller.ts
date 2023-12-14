import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { FindOneParams } from '../common/decorators/find-params';
import { ListSeriesAgrupadas } from './dto/list-variavel.dto';
import { FilterPeriodoFormulaCompostaDto, ListaPeriodoFormulaCompostaDto } from './dto/variavel.formula-composta.dto';
import { VariavelFormulaCompostaService } from './variavel.formula-composta.service';

@ApiTags('Indicador')
@Controller('')
export class VariavelFormulaCompostaController {
    constructor(private readonly variavelFCService: VariavelFormulaCompostaService) {}

    @Get('formula-variavel/:id/periodos')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar', 'CadastroIndicador.inserir', 'CadastroMeta.listar')
    async getFormulaCompostaPeriodos(@Param() params: FindOneParams): Promise<ListaPeriodoFormulaCompostaDto> {
        return {
            linhas: await this.variavelFCService.getFormulaCompostaPeriodos(params.id),
        };
    }

    @Get('formula-variavel/:id/series')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar', 'CadastroIndicador.inserir', 'CadastroMeta.listar')
    async getFormulaCompostaSeries(
        @Param() params: FindOneParams,
        @Query() filter: FilterPeriodoFormulaCompostaDto
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelFCService.getFormulaCompostaSeries(params.id, filter);
    }
}
