import { ApiHideProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterCronogramaDto {
    /**
     * Filtrar por meta_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
     * Filtrar por iniciativa_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
     * Filtrar por atividade_id?
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id' })
    @Type(() => Number)
    atividade_id?: number;

    // usado internamente para filtrar apenas cronogramas que os ids derem match
    @ApiHideProperty()
    cronograma_etapa_ids?: number[];
}
