import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';
import { CreateIndicadorDto, FormulaVariaveis } from './create-indicador.dto';

export class UpdateIndicadorDto extends OmitType(PartialType(CreateIndicadorDto), [
    'meta_id',
    'iniciativa_id',
    'atividade_id',
    'regionalizavel',
    'nivel_regionalizacao',
    'periodicidade',
] as const) {


    /**
    * Expressão para montar calcular as series do indicador.
    *
    * Para funções, veja o [manual do PostgreSQL](https://www.postgresql.org/docs/14/functions-math.html) para entender o funcionamento.
    *
    *
    * Funções com 1 parâmetro (sempre obrigatórios):
    *   `FACTORIAL(expr)`, `ABS(expr)`, `LN(expr)`, `FLOOR(expr)`, `CEIL(expr)`, `EXP(expr)`
    *
    *
    * Funções com 2 parâmetros (sempre obrigatórios):
    *   `ROUND(expr, precision)`, `POWER(a, raisedToPower)`, `LOG(base, toLogOfBase)`, `NULLIF(expr, ifNullValue)`, `DIV(expr, expr)`, `MOD(expr, expr)`
    *
    *
    * Operações:
    *
    *  `*` multiplicação
    *
    *  `/` divisão
    *
    * `-` subtração
    *
    * `+` soma
    *
    * `^` exponencial (precedência esquerda pra direita)
    *
    *
    * Referências das variáveis enviar "$" + entre 1 até 5 caracteres em uppercase
    *
    * A referência não pode ser repetida entre o mesmo indicador.
    *
    * @example "CEIL($A + $SHIN) / 100.4 * POWER($SHIN + LN($A), 1) * FLOOR(1- 1 / 2) + LOG(2, 4)"
    */
    @IsOptional()
    @IsString({ message: '$property| Precisa ser um texto de formula válido' })
    @ValidateIf((object, value) => value !== null)
    formula?: string | null

    /**
    * Variáveis para usar na expressão
    */
    @IsOptional()
    formula_variaveis?: FormulaVariaveis[]

    /**
    * acumulado_usa_formula - Se é pra calcular o acumulado usando a formula ou é pra fazer a conta automaticamente pelos valores resultantes
    */
    @IsOptional()
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    @ValidateIf((object, value) => value !== null)
    acumulado_usa_formula?: boolean | null;

}
