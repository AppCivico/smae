import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class FilterVariavelDto {
    /**
     * Filtrar por meta_id? (Se usado, não pode filtra via indicador_id)
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
     * Filtrar por iniciativa_id? (Se usado, não pode filtra via indicador_id)
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

    /**
     * Filtrar por indicador_id? (Se usado, não pode filtra via meta_id)
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| indicador_id' })
    @Type(() => Number)
    indicador_id?: number;

    /**
     * Não retornar as variáveis desativadas? envie true
     * @example "1"
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    remover_desativados?: boolean;
}
