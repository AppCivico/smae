import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class FilterObjetivoEstrategicoDto {
    /**
   * Filtrar por pdm_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| pdm_id' })
    @Type(() => Number)
    pdm_id?: number;
}
