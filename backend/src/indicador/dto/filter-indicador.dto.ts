import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class FilterIndicadorDto {
    /**
   * Filtrar por meta_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
   * Filtrar por iniciativa_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
  * Filtrar por atividade_id?
  * @example "1"
   */
    @IsOptional()
    @IsPositive({ message: '$property| atividade_id' })
    @Type(() => Number)
    atividade_id?: number;

    /**
    * Filtrar por id
    * @example "1"
   */
    @IsOptional()
    @IsPositive({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}
