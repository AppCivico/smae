import { ApiProperty } from "@nestjs/swagger"
import { StatusRisco } from "@prisma/client"
import { IsEnum, IsInt, IsString, MaxLength } from "class-validator"
import { IsOnlyDate } from "../../../common/decorators/IsDateOnly"

export class CreatePlanoAcaoMonitoramentoDto {
    @IsInt()
    plano_acao_id: number

    @IsOnlyDate()
    data_afericao: Date

    @IsString()
    @MaxLength(2048)
    descricao: string
}
