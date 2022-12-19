import { Type } from "class-transformer"
import { IsNumber, IsOptional } from "class-validator"

export class FiltroMetasIniAtividadeDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    meta_id?: number

    @IsOptional()
    @IsNumber()
    @Type(() => Number)

    iniciativa_id?: number

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    atividade_id?: number
}