import { ApiProperty, IntersectionType } from "@nestjs/swagger"
import { TipoRelatorio } from "@prisma/client"
import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsOptional, ValidateIf } from "class-validator"
import { FiltroMetasIniAtividadeDto } from "../../relatorios/dto/filtros.dto"

export const PeriodoRelatorioPrevisaoCustoDto = {
    Corrente: 'Corrente',
    Anterior: 'Anterior'
};

export type PeriodoRelatorioPrevisaoCustoDto = (typeof PeriodoRelatorioPrevisaoCustoDto)[keyof typeof PeriodoRelatorioPrevisaoCustoDto]

export class PrevisaoCustoParams {
    /**
     * @example "Corrente"
    */
    @ApiProperty({ enum: PeriodoRelatorioPrevisaoCustoDto, enumName: 'PeriodoDto' })
    @IsEnum(PeriodoRelatorioPrevisaoCustoDto, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(PeriodoRelatorioPrevisaoCustoDto).join(', ')
    })
    periodo_ano: PeriodoRelatorioPrevisaoCustoDto


    /**
     * @example "2022"
    */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @IsOptional()
    ano?: number
}

export class CreateRelPrevisaoCustoDto extends IntersectionType(
    FiltroMetasIniAtividadeDto,
    PrevisaoCustoParams
) { }
