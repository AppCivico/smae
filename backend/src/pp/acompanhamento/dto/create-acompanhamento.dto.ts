import { Type } from "class-transformer"
import { IsOptional, IsString, ValidateIf } from "class-validator"
import { IsOnlyDate } from "src/common/decorators/IsDateOnly"

export class CreateProjetoAcompanhamentoDto {
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data_registro: Date

    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    prazo_encaminhamento?: Date

    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    prazo_realizado?: Date

    @IsString()
    participantes: string
    
    @IsOptional()
    @IsString()
    detalhamento?: string
    
    @IsOptional()
    @IsString()
    encaminhamento?: string
    
    @IsOptional()
    @IsString()
    responsavel?: string
    
    @IsOptional()
    @IsString()
    observacao?: string
    
    @IsOptional()
    @IsString()
    detalhamento_status?: string
    
    @IsOptional()
    @IsString()
    pontos_atencao?: string
}
