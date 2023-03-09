import { Type } from "class-transformer"
import { IsNumber, IsOptional, IsString, ValidateIf } from "class-validator"
import { IsOnlyDate } from "src/common/decorators/IsDateOnly"

export class CreateRiscoDto {
    @IsNumber()
    codigo: number

    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    criado_em: Date

    @IsNumber()
    @IsOptional()
    probabilidade: number
    
    @IsNumber()
    @IsOptional()
    impacto: number

    @IsOptional()
    @IsString()
    descricao: string
    
    @IsOptional()
    @IsString()
    causa: string
    
    @IsOptional()
    @IsString()
    consequencia: string
}

export class CreateProjetoRiscoTarefaDto {
    @IsNumber()
    tarefa_id: number
}

export class CreateProjetoRiscoTarefaPlanoAcaoDto {
    @IsNumber()
    orgao_id: number

    @IsString()
    responsavel: string

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
    medidas_contrapartida: string
}