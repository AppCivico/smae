import { Transform, Type } from "class-transformer";
import { IsBoolean, IsOptional, IsPositive } from "class-validator";

export class FilterVariavelDto {
    /**
   * Filtrar por meta_id? (Se usado, não pode filtra via indicador_id)
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| meta_id' })
    @Type(() => Number)
    meta_id?: number;

    /**
   * Filtrar por iniciativa_id? (Se usado, não pode filtra via indicador_id)
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| iniciativa_id' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
  * Filtrar por indicador_id? (Se usado, não pode filtra via meta_id)
  * @example "1"
   */
    @IsOptional()
    @IsPositive({ message: '$property| indicador_id' })
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
