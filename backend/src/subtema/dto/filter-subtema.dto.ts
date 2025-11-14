import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterSubTemaDto {
    @IsOptional()
    @IsInt({ message: 'id' })
    @Type(() => Number)
    id?: number;

    /**
     * Filtrar por pdm_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: 'pdm_id' })
    @Type(() => Number)
    pdm_id?: number;
}
