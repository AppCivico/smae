import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../auth/transforms/number-array.transform';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { NumberTransform } from '../../auth/transforms/number.transform';
import { AscDescEnum } from '../../pp/projeto/dto/filter-projeto.dto';
import { Periodicidade } from '@prisma/client';

export class FilterVariavelDto {
    /**
     * Filtrar por meta_id? (Se usado, não pode filtra via indicador_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
     * Filtrar por iniciativa_id? (Se usado, não pode filtra via indicador_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
     * Filtrar por atividade_id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'atividade_id' })
    @Type(() => Number)
    atividade_id?: number;

    /**
     * Filtrar por indicador_id? (Se usado, não pode filtra via meta_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'indicador_id' })
    @Type(() => Number)
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
    @Type(() => Number)
    id?: number;

    @IsOptional()
    @IsArray({ message: 'assuntos(s): precisa ser uma array.' })
    @ArrayMaxSize(1000, { message: 'assuntos(s): precisa ter no máximo 1000 items' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransformOrUndef)
    assuntos?: number[];

    @IsOptional()
    @IsInt({ message: 'Órgão precisa ser um número inteiro' })
    @Type(() => Number)
    orgao_id?: number;

    @IsOptional()
    @IsInt({ message: 'Órgão proprietário precisa ser um número inteiro' })
    @Type(() => Number)
    orgao_proprietario_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    palavra_chave?: string;

    @IsOptional()
    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', '),
    })
    periodicidade?: Periodicidade;
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
    ordem_coluna: string = 'codigo';
}

export class FilterVariavelGlobalDto extends IntersectionType(FilterVariavelDto, VariavelOrderByDto) {
    @IsOptional()
    @IsInt({ message: '$property| plano_setorial_id' })
    @Type(() => Number)
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
}
