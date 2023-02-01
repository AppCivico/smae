import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterMetaDto {
    /**
     * Filtrar por pdm_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| pdm_id' })
    @Type(() => Number)
    pdm_id?: number;

    /**
     * Filtrar por id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}
