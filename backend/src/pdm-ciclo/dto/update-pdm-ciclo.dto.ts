import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional } from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { NumberTransform } from '../../auth/transforms/number.transform';

export class UpdatePdmCicloDto {
    /**
     * Inicio Coleta
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    inicio_coleta: Date;

    /**
     * Inicio qualificação e final da coleta
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    inicio_qualificacao: Date;

    /**
     * Inicio risco e final da qualificação
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    inicio_analise_risco: Date;

    /**
     * Inicio fechamento e final de risco
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    inicio_fechamento: Date;

    /**
     * Fechamento e fim do ciclo
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    fechamento: Date;
}

export class FilterPdmCiclo {
    @IsInt()
    @Transform(({ value }: any) => +value)
    pdm_id: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    apenas_futuro?: boolean;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    ano?: number;
}

export class FilterPsCiclo extends FilterPdmCiclo {
    @IsOptional()
    @IsInt()
    meta_id?: number;
}

export class FilterMonitCicloDto {
    @IsInt()
    @Transform(NumberTransform)
    meta_id: number;
}
