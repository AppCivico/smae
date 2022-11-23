import { Transform, Type } from "class-transformer";
import { IsBoolean, isBoolean, IsInt, IsOptional } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class UpdatePdmCicloDto {
    /**
    * Inicio Coleta
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_coleta: Date

    /**
    * Inicio qualificação e final da coleta
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_qualificacao: Date

    /**
    * Inicio risco e final da qualificação
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_analise_risco: Date

    /**
    * Inicio fechamento e final de risco
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_fechamento: Date

    /**
    * Fechamento e fim do ciclo
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    fechamento: Date
}

export class FilterPdmCiclo {
    @IsInt()
    @Transform(({ value }: any) => +value)
    pdm_id: number

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    apenas_futuro?: boolean

}