import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../auth/transforms/number-array.transform';

export class FilterTagDto {
    /**
     * Filtrar por id?
     * @example "1"
     */
    @IsOptional()
    @IsArray()
    @IsInt({ message: 'id' , each: true })
    @Transform(NumberArrayTransformOrUndef)
    id?: number[];

    /**
     * Filtrar por pdm_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: 'pdm_id' })
    @Type(() => Number)
    pdm_id?: number;
}
