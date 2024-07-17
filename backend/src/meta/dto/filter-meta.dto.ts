import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { NumberTransform } from '../../auth/transforms/number.transform';

export class FilterMetaDto {
    /**
     * Filtrar por pdm_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| pdm_id' })
    @Type(() => Number)
    pdm_id?: number;

    /**
     * Filtrar por id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}

export class FilterRelacionadosDTO {
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    meta_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    iniciativa_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    atividade_id?: number;
}
