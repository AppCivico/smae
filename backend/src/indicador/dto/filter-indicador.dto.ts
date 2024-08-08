import { PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { DateTransform } from '../../auth/transforms/date.transform';

export class FilterIndicadorDto {
    /**
     * Filtrar por meta_id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
     * Filtrar por iniciativa_id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
     * Filtrar por atividade_id?
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id' })
    @Type(() => Number)
    atividade_id?: number;

    /**
     * Filtrar por id
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| id' })
    @Type(() => Number)
    id?: number;
}

export class FilterSerieVariavelDto {
    /**
     * Filtrar valores de
     * @example ""
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_inicio?: Date;

    /**
     * Filtrar valores até
     * @example ""
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_fim?: Date;

    /**
     * Filtrar apenas variaveis que são da meta_id
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
     * Filtrar variaveis de uma atividade_id
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id' })
    @Type(() => Number)
    atividade_id?: number;

    /**
     * Filtrar variaveis de uma iniciativa
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa' })
    @Type(() => Number)
    iniciativa_id?: number;
}

export class FilterIndicadorSerieDto extends PickType(FilterSerieVariavelDto, ['data_inicio', 'data_fim']) {}
