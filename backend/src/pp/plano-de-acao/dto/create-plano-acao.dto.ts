import { Type } from "class-transformer"
import { IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator"
import { IsOnlyDate } from "src/common/decorators/IsDateOnly"

export class CreatePlanoAcaoDto {
    @IsNumber()
    projeto_risco_id: number

    @IsNumber()
    orgao_id: number

    @IsString()
    @IsOptional()
    responsavel?: string

    @IsString()
    contramedida: string

    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    prazo_contramedida: Date | null

    @IsNumber()
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    custo: number | null

    @IsNumber()
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    custo_percentual: number | null

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    medidas_de_contingencia: string | undefined

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    contato_do_responsavel: string

    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data_termino: Date | null

}
