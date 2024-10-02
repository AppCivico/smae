import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterAtividadeDto {
    /**
     * Filtrar por iniciativa_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
     * Filtrar id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}
