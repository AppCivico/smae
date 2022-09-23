import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class FilterTagDto {
    /**
   * Filtrar por pdm_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| pdm_id' })
    @Type(() => Number)
    pdm_id?: number;

    /**
   * Filtrar por meta_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| pdm_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
   * Filtrar por iniciativa_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| pdm_id' })
    @Type(() => Number)
    iniciativa_id?: number;
}
