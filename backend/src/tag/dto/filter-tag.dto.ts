import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../auth/transforms/number-array.transform';

export class FilterTagDto {
    /**
     * Filtrar por id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Transform(NumberArrayTransformOrUndef)
    id?: number[];

    /**
     * Filtrar por pdm_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| pdm_id' })
    @Type(() => Number)
    pdm_id?: number;
}
