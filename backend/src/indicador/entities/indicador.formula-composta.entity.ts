import { FormulaVariaveis } from '../dto/update-indicador.dto';

export class IndicadorFormulaCompostaDto {
    id: number;
    titulo: string;
    formula: string | null;
    formula_variaveis: FormulaVariaveis[];
    // pensar que provavelmente o frontend vai querer uma coluna pra saber se é herdada ou não, então fica aqui
    indicador_origem_id: number | null;
}
