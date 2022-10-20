import { ApiProperty } from "@nestjs/swagger";
import { Periodicidade, Periodo } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreateParamsPainelConteudoDto {

    @IsArray({ message: '$property| precisa ser uma array, campo obrigatório' })
    metas: number[]
}

export class CreatePainelConteudoDto {
    @IsPositive({ message: '$property| painel precisa ser um número' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    painel_id: number

    @IsPositive({ message: '$property| meta precisa ser um número' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    meta_id: number

    @IsPositive({ message: '$property| indicador precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    indicador_id?: number

    @IsPositive({ message: '$property| tema precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    ordem?: number

    @IsBoolean()
    mostrar_acumulado: boolean

    @IsBoolean()
    mostrar_indicador: boolean

    @IsBoolean()
    mostrar_planejado: boolean

    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', ')
    })
    periodicidade: Periodicidade

    @ApiProperty({ enum: Periodo, enumName: 'Periodo' })
    @IsEnum(Periodo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodo).join(', ')
    })
    periodo?: Periodo

    @IsOptional()
    @IsOnlyDate()
    periodo_fim?: Date

    @IsOptional()
    @IsOnlyDate()
    periodo_inicio?: Date

    @IsOptional()
    @IsNumber()
    periodo_valor?: number

}