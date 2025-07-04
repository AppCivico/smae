import { FormulaCompostaReferenciandoItemDto } from './formula-composta-referenciando-item.dto';
import { IndicadorReferenciandoItemDto } from './indicador-referenciando-item.dto';
import { VariavelResumo } from './list-variavel.dto';

export class VariavelRelacionamentosResponseDto {
    indicadores_referenciando: IndicadorReferenciandoItemDto[];
    formulas_compostas_referenciando: FormulaCompostaReferenciandoItemDto[];
    variavel: VariavelResumo | null;
}
