import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterIniciativaDto {
    /**
     * Filtrar por meta_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: 'meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
     * Filtrar por id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: 'id' })
    @Type(() => Number)
    id?: number;
}
