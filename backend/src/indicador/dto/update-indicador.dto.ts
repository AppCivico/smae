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
    * Expressão para montar calcular as series do indicador. Para funções, siga o manual do PostgreSQL para entender o funcionamento.
    *
    * Contantes:
    *   PI
    *
    *
    * Funções com 1 parâmetro (sempre obrigatórios):
    *   FACTORIAL, ABS, DIV, MOD, EXP, LN, FLOOR, CEIL
    *
    *
    * Funções com 2 parâmetros (sempre obrigatórios):
    *   ROUND, POWER, LOG
    *
    *
    * Operações:
    *
    * * multiplicação
    *
    * / divisão
    *
    * - subtração
    *
    * + soma
    *
    * ^ exponencial (precedência esquerda pra direita)
    *
    *
    * Referencias das variáveis: $REFERENCIA
    *   de 1 até 5 letras em UPPERCASE, não repetidos
    *
    * @example "CEIL($A + $B) / 100.4 * power( $B + LN( $A ) , 1 ) * FLOOR( 1 - 1 / 2 ) + LOG(2,4)"
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
    * calcular_acumulado - se é para usar o acumulado tbm nas series da formula
    */
    @IsOptional()
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    @ValidateIf((object, value) => value !== null)
    calcular_acumulado?: boolean | null;

}
