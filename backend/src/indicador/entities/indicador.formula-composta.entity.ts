import { IndicadorVariavelOrigemDto } from '../../variavel/entities/variavel.entity';
import { CreateIndicadorFormulaCompostaDto } from '../dto/create-indicador.formula-composta.dto';
import { FormulaVariaveis } from '../dto/update-indicador.dto';

export class IndicadorFormulaCompostaDto {
    id: number;
    titulo: string;
    formula: string | null;
    formula_variaveis: FormulaVariaveis[];
    nivel_regionalizacao: number | null;
    mostrar_monitoramento: boolean;
    // pensar que provavelmente o frontend vai querer uma coluna pra saber se é herdada ou não, então fica aqui
    indicador_origem: IndicadorVariavelOrigemDto | null;
}

export class IndicadorFormulaCompostaEmUsoDto {
    formula_composta_id: number;
    titulo: string;
    nivel_regionalizacao: number | null;
    mostrar_monitoramento: boolean;
}

export class ListIndicadorFormulaCompostaEmUsoDto {
    linhas: IndicadorFormulaCompostaEmUsoDto[];
}

// na vdd, só pra ter um nome diferente, pq ela precisa retornar tudo o que é necessário pra criar
export class GeneratorFormulaCompostaReturnDto extends CreateIndicadorFormulaCompostaDto {}
