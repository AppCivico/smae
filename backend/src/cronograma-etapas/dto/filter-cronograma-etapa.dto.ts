import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsPositive } from "class-validator";

export class FilterCronogramaEtapaDto {
    /**
   * Filtrar por cronograma_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| cronograma_id' })
    @Type(() => Number)
    cronograma_id?: number;

    /**
    * Filtrar por etapa_id?
    * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| etapa_id' })
    @Type(() => Number)
    etapa_id?: number;

    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    inativo?: boolean
}
