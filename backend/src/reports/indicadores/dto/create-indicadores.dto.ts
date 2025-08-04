import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { TipoRelatorio } from 'src/generated/prisma/client';
import { Transform, Expose, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { FiltroMetasIniAtividadeDto } from '../../relatorios/dto/filtros.dto';
import { NumberArrayTransformOrUndef } from '../../../auth/transforms/number-array.transform';
import { NumberTransformOrUndef } from '../../../auth/transforms/number.transform';

export const SemestreDto = {
    Primeiro: 'Primeiro',
    Segundo: 'Segundo',
};

export type SemestreDto = (typeof SemestreDto)[keyof typeof SemestreDto];

export const PeriodoRelatorioDto = {
    Anual: 'Anual',
    Semestral: 'Semestral',
};

export type PeriodoRelatorioDto = (typeof PeriodoRelatorioDto)[keyof typeof PeriodoRelatorioDto];

export class IndicadorParams {
    /**
     * @example "Analitico"
     */
    @ApiProperty({ enum: TipoRelatorio, enumName: 'TipoRelatorio' })
    @IsEnum(TipoRelatorio, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoRelatorio).join(', '),
    })
    @Expose()
    tipo: TipoRelatorio;

    /**
     * required se enviar que o tipo é semestre
     * @example ""
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @ApiProperty({ enum: SemestreDto, enumName: 'SemestreDto' })
    @IsEnum(SemestreDto, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(SemestreDto).join(', '),
    })
    @Expose()
    semestre?: SemestreDto | null;

    /**
     * @example "Primeiro"
     */
    @ApiProperty({ enum: PeriodoRelatorioDto, enumName: 'PeriodoDto' })
    @IsEnum(PeriodoRelatorioDto, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(PeriodoRelatorioDto).join(', '),
    })
    @Expose()
    periodo: PeriodoRelatorioDto;

    /**
     * @example "2022"
     */
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @Expose()
    ano: number;

    /**
     * Se devemos trazer o analitico desde o ano do inicio ou não
     * @example "true"
     */
    @IsOptional()
    @IsBoolean()
    @Expose()
    analitico_desde_o_inicio?: boolean;

    @Expose()
    mes: number;
}

export class CreateRelIndicadorDto extends IntersectionType(FiltroMetasIniAtividadeDto, IndicadorParams) {
    @IsOptional()
    @IsBoolean()
    @Expose()
    listar_variaveis_regionalizadas: boolean;

    @IsNumber()
    @Type(() => Number)
    declare pdm_id?: number; // reaplicado pra tirar o required do campo
}

export class CreateRelIndicadorRegioesDto extends CreateRelIndicadorDto {
    @IsOptional()
    @Transform(NumberArrayTransformOrUndef)
    regioes?: number[];
}
