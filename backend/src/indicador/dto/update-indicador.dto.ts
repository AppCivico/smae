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
    * Expressão para montar calcular as series do indicador
    *
    * Funções: CEIL, FLOOR, POWER, LOG
    *
    * Operações: + - / *
    *
    * Referencias das variáveis: $REFERENCIA
    *
    * @example "CEIL($A + $B) / 100.4 * power( $B + LOG( $A ) ) * FLOOR( 1 - 1 / 2 )"
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
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    @ValidateIf((object, value) => value !== null)
    calcular_acumulado?: boolean | null

}
