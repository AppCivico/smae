import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class FilterIniciativaDto {
    /**
   * Filtrar por pdm_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| pdm_id' })
    @Type(() => Number)
    meta_id: number;
}
