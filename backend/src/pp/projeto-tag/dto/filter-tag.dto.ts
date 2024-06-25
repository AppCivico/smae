import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterProjetoTagDto {
    /**
     * Filtrar por id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}
