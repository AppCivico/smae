import { IsOptional } from "class-validator"

export class FiltroMetasIniAtividadeDto {
    @IsOptional()
    meta_id?: number

    @IsOptional()
    iniciativa_id?: number

    @IsOptional()
    atividade_id?: number
}