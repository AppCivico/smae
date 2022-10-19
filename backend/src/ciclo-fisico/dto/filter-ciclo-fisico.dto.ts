import { Type } from "class-transformer";
import { IsPositive } from "class-validator";

export class FilterCicloFisicoDto {
    /**
   * Filtrar por pdm_id?
   * @example "1"
    */
    @IsPositive({ message: '$property| pdm_id' })
    @Type(() => Number)
    pdm_id: number;
}
