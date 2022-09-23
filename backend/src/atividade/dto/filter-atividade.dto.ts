import { Type } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";

export class FilterAtividadeDto {
    /**
   * Filtrar por iniciativa_id?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;
}
