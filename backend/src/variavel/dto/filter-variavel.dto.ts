import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Periodicidade } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../auth/transforms/number-array.transform';
import { NumberTransform } from '../../auth/transforms/number.transform';
import { AscDescEnum } from '../../pp/projeto/dto/filter-projeto.dto';
import { VAR_CATEGORICA_AS_NULL } from '../../common/dto/consts';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class FilterVariavelDto {
    /**
     * Filtrar por meta_id? (Se usado, não pode filtra via indicador_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'meta_id' })
    @Transform(NumberTransform)
    meta_id?: number;

    /**
     * Filtrar por iniciativa_id? (Se usado, não pode filtra via indicador_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'iniciativa_id' })
    @Transform(NumberTransform)
    iniciativa_id?: number;

    /**
     * Filtrar por atividade_id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'atividade_id' })
    @Transform(NumberTransform)
    atividade_id?: number;

    /**
     * Filtrar por indicador_id? (Se usado, não pode filtra via meta_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'indicador_id' })
    @Transform(NumberTransform)
    indicador_id?: number;

    /**
     * Não retornar as variáveis desativadas? envie true
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    remover_desativados?: boolean;

    @IsOptional()
    @IsInt({ message: 'id' })
    @Transform(NumberTransform)
    id?: number;

    @IsOptional()
    @IsInt({ message: 'id' })
    @Transform(NumberTransform)
    formula_composta_id?: number;

    @IsOptional()
    @IsArray({ message: 'assuntos(s): precisa ser uma array.' })
    @ArrayMaxSize(1000, { message: 'assuntos(s): precisa ter no máximo 1000 items' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransformOrUndef)
    assuntos?: number[];

    @IsOptional()
    @IsInt({ message: 'Órgão precisa ser um número inteiro' })
    @Transform(NumberTransform)
    orgao_id?: number;

    @IsOptional()
    @IsInt({ message: 'Mediação Órgão precisa ser um número inteiro' })
    @Transform(NumberTransform)
    medicao_orgao_id?: number;

    @IsOptional()
    @IsInt({ message: 'Validação Órgão precisa ser um número inteiro' })
    @Transform(NumberTransform)
    validacao_orgao_id?: number;

    @IsOptional()
    @IsInt({ message: 'Liberação Órgão precisa ser um número inteiro' })
    @Transform(NumberTransform)
    liberacao_orgao_id?: number;

    @IsOptional()
    @IsInt({ message: 'Órgão proprietário precisa ser um número inteiro' })
    @Transform(NumberTransform)
    orgao_proprietario_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Palavra Chave' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    palavra_chave?: string;

    @IsOptional()
    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', '),
    })
    periodicidade?: Periodicidade;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    regiao_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    nivel_regionalizacao?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    variavel_mae_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Código' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    codigo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    titulo?: string;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    @ApiProperty({
        description: `ID da variável categórica, enviar ${VAR_CATEGORICA_AS_NULL} para retornar os registros com valor NULL`,
    })
    variavel_categorica_id?: number;
}

export const VariavelOrderEnum = {
    id: 'id',
    titulo: 'titulo',
    codigo: 'codigo',
    criado_em: 'criado_em',
};
export type VariavelOrderEnum = keyof typeof VariavelOrderEnum;

export class VariavelOrderByDto {
    @IsEnum(AscDescEnum)
    @ApiProperty({ enum: AscDescEnum, default: 'asc' })
    ordem_direcao: 'asc' | 'desc' = 'asc';

    @IsEnum(VariavelOrderEnum)
    @ApiProperty({ enum: VariavelOrderEnum, enumName: 'VariavelOrderEnum', default: 'codigo' })
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Ordem Coluna' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    ordem_coluna: string = 'codigo';
}

export class FilterVariavelGlobalDto extends IntersectionType(FilterVariavelDto, VariavelOrderByDto) {
    @IsOptional()
    @IsInt({ message: '$property| plano_setorial_id' })
    @Transform(NumberTransform)
    plano_setorial_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    ipp?: number = 25;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    pagina?: number = 1;

    @IsOptional()
    @IsString()
    token_paginacao?: string;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    not_indicador_id?: number;
}

export class FilterVariavelRelacionamentosDto {
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    @ApiProperty({
        description:
            'Caso true, busca incluirá as variáveis filhas e a mãe da variável informada, caso seja informada uma filha, a mãe é encontrada automaticamente.',
        default: true,
    })
    buscar_familia_completa?: boolean;
}
