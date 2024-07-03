import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../auth/transforms/number-array.transform';

export class FilterVariavelDto {
    /**
     * Filtrar por meta_id? (Se usado, não pode filtra via indicador_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
     * Filtrar por iniciativa_id? (Se usado, não pode filtra via indicador_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
     * Filtrar por atividade_id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id' })
    @Type(() => Number)
    atividade_id?: number;

    /**
     * Filtrar por indicador_id? (Se usado, não pode filtra via meta_id)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| indicador_id' })
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
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;

    @IsOptional()
    @IsArray({ message: '$property| assuntos(s): precisa ser uma array.' })
    @ArrayMaxSize(1000, { message: '$property| assuntos(s): precisa ter no máximo 1000 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransformOrUndef)
    assuntos?: number[];
}
