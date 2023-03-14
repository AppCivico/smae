import { Type } from "class-transformer"
import { IsNumber, IsOptional, IsString, ValidateIf } from "class-validator"
import { IsOnlyDate } from "src/common/decorators/IsDateOnly"

export class CreatePlanoAcaoDto {
    @IsNumber()
    projeto_risco_id: number

    @IsNumber()
    @IsOptional()
    orgao_id?: number

    @IsString()
    @IsOptional()
    responsavel?: string

    @IsString()
    contramedida: string

    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    prazo_contramedida: Date

    @IsNumber()
    custo: number

    @IsNumber()
    custo_percentual: number

    @IsString()
    medidas_de_contingencia: string
}