import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class FilterIniciativaDto {
    /**
   * Filtrar por meta_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id: number;
}
