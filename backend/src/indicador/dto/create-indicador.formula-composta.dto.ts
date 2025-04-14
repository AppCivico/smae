import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreateGeradorVariavelPDMDto } from '../../variavel/dto/create-variavel.dto';
import { CreateIndicadorDto } from './create-indicador.dto';
import { FormulaVariaveis } from './update-indicador.dto';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateIndicadorFormulaCompostaDto extends PickType(CreateIndicadorDto, ['nivel_regionalizacao']) {
    /**
     * Titulo
     */
    @IsString({ message: '$property| Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
    @IsArray()
    formula_variaveis: FormulaVariaveis[];

    @IsBoolean()
    mostrar_monitoramento: boolean;
}

// query dois campos required, menos todos os outros, que podem entrar como Patch
export class UpdateIndicadorFormulaCompostaDto extends IntersectionType(
    PartialType(OmitType(CreateIndicadorFormulaCompostaDto, ['formula', 'formula_variaveis'] as const)),
    PickType(CreateIndicadorFormulaCompostaDto, ['formula', 'formula_variaveis'] as const)
) {}

export const OperacaoPadraoDto = {
    'Soma': 'Soma',
    'Subtração': 'Subtração',
    'Divisão': 'Divisão',
    'Multiplicação': 'Multiplicação',
    'Média Aritmética': 'Média Aritmética',
} as const;

export type OperacaoPadraoDto = (typeof OperacaoPadraoDto)[keyof typeof OperacaoPadraoDto];
// ta em ordem alfa, mas eu acho que vão pedir pra mudar, pq faz mais sentido Soma / Média Aritmética, depois os outros
export const OperacaoSuportadaOrdem: OperacaoPadraoDto[] = [
    'Divisão',
    'Média Aritmética',
    'Multiplicação',
    'Soma',
    'Subtração',
];

export class GeneratorFormulaCompostaFormDto extends IntersectionType(
    PickType(CreateIndicadorFormulaCompostaDto, ['titulo'] as const),
    PickType(CreateIndicadorFormulaCompostaDto, ['nivel_regionalizacao'] as const),
    PickType(CreateIndicadorFormulaCompostaDto, ['mostrar_monitoramento'] as const),
    PickType(CreateGeradorVariavelPDMDto, ['regioes', 'codigo'] as const),
    PickType(FormulaVariaveis, ['janela', 'usar_serie_acumulada'] as const)
) {
    @IsEnum(OperacaoPadraoDto)
    @ApiProperty({ enum: OperacaoPadraoDto, enumName: 'OperacaoPadraoDto' })
    operacao: OperacaoPadraoDto;
}

export class FilterFormulaCompostaFormDto {
    /**
     * prefixo que será pesquisado nas variaveis
     */
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Código' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    codigo: string;
}

export class FormulaCompostaRegiaoDto {
    id: number;
    descricao: string;
    nivel: number;
}

export class FormulaCompostaVariaveisComRegiaoDto {
    id: number;
    codigo: string;
    regiao: FormulaCompostaRegiaoDto;
}

export class FormulaCompostaVariaveisSemRegiaoDto {
    id: number;
    codigo: string;
}

export class FilterFormulaCompostaReturnDto {
    variaveis: FormulaCompostaVariaveisComRegiaoDto[];
    variaveis_sem_regiao: FormulaCompostaVariaveisSemRegiaoDto[];

    @ApiProperty({ enum: OperacaoPadraoDto, enumName: 'OperacaoPadraoDto', isArray: true })
    operacoes: OperacaoPadraoDto[];
}
