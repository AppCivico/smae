import { Type } from "class-transformer"
import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator"
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
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    tarefa_id: number[]
}

export class CreateProjetoRiscoPlanoAcaoDto {
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