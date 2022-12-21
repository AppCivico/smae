import { ApiProperty, IntersectionType } from "@nestjs/swagger"
import { TipoRelatorio } from "@prisma/client"
import { IsEnum, IsInt, IsOptional } from "class-validator"
import { FiltroMetasIniAtividadeDto } from "../../relatorios/dto/filtros.dto"

export const SemestreDto = {
    Primeiro: 'Primeiro',
    Segundo: 'Segundo'
};

export type SemestreDto = (typeof SemestreDto)[keyof typeof SemestreDto]

export const PeriodoRelatorioDto = {
    Anual: 'Anual',
    Semestral: 'Semestral'
};

export type PeriodoRelatorioDto = (typeof PeriodoRelatorioDto)[keyof typeof PeriodoRelatorioDto]

export class IndicadorParams {
    /**
     * @example "Analitico"
    */
    @ApiProperty({ enum: TipoRelatorio, enumName: 'TipoRelatorio' })
    @IsEnum(TipoRelatorio, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoRelatorio).join(', ')
    })
    tipo: TipoRelatorio

    /**
     * required se enviar que o tipo é semestre
     * @example ""
    */
    @IsOptional()
    @ApiProperty({ enum: SemestreDto, enumName: 'SemestreDto' })
    @IsEnum(SemestreDto, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(SemestreDto).join(', ')
    })
    semestre?: SemestreDto

    /**
     * @example "Primeiro"
    */
    @ApiProperty({ enum: PeriodoRelatorioDto, enumName: 'PeriodoDto' })
    @IsEnum(PeriodoRelatorioDto, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(PeriodoRelatorioDto).join(', ')
    })
    periodo: PeriodoRelatorioDto


    /**
     * @example "2022"
    */
    @IsInt()
    ano: number
}

export class CreateRelIndicadorDto extends IntersectionType(
    FiltroMetasIniAtividadeDto,
    IndicadorParams
) { }
