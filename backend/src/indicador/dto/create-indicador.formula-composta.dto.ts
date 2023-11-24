import { Type } from 'class-transformer';
import { ArrayMaxSize, IsString, MaxLength, ValidateNested } from 'class-validator';
import { FormulaVariaveis } from './update-indicador.dto';
import { IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger';

export class CreateIndicadorFormulaCompostaDto {
    /**
     * Titulo
     */
    @IsString({ message: '$property| Precisa ser alfanumérico' })
    @MaxLength(60, { message: '$property| código 60 caracteres' })
    titulo: string;

    /**
     * Expressão para montar calcular as series do indicador, veja a documentação do indicador.
     * Uma exceção é, não pode conter uma referencia para outra formula composta (`@_123`) pois
     * o sistema não aceita recursão composição.
     *
     * @example "($_1 + $_2) / 2"
     */
    @IsString({ message: '$property| Precisa ser um texto de formula válido' })
    formula: string;

    /**
     * Variáveis para usar na expressão
     */
    @ValidateNested({ each: true })
    @Type(() => FormulaVariaveis)
    @ArrayMaxSize(100000, { message: 'Variáveis de expressão precisa ter no máximo 100000 items' })
    formula_variaveis: FormulaVariaveis[];
}

// query dois campos required, menos todos os outros, que podem entrar como Patch
export class UpdateIndicadorFormulaCompostaDto extends IntersectionType(
    PartialType(OmitType(CreateIndicadorFormulaCompostaDto, ['formula', 'formula_variaveis'] as const)),
    PickType(CreateIndicadorFormulaCompostaDto, ['formula', 'formula_variaveis'] as const)
) {}
