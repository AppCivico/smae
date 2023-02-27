import { ApiProperty } from "@nestjs/swagger"
import { TarefaDependenteTipo } from "@prisma/client"
import { Type } from "class-transformer"
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from "class-validator"
import { IsOnlyDate } from "../../../common/decorators/IsDateOnly"

export class TarefaDependenciaDto {

    @IsInt({ message: '$property| precisa ser inteiro' })
    dependencia_tarefa_id: number

    @ApiProperty({ enum: TarefaDependenteTipo, enumName: 'TarefaDependenteTipo' })
    @IsEnum(TarefaDependenteTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TarefaDependenteTipo).join(', '),
    })
    tipo: TarefaDependenteTipo

    @IsInt({ message: '$property| precisa ser inteiro' })
    latencia: number
}

export class CheckDependenciasDto {
    @IsInt({ message: '$property| precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    tarefa_corrente_id: number | null


    @IsArray({ message: '$property| precisa ser uma array, campo obrigatório' })
    @ValidateNested({ each: true })
    @Type(() => TarefaDependenciaDto)
    @ArrayMinSize(1)
    dependencias?: TarefaDependenciaDto[];
}

export class CreateTarefaDto {

    @IsInt({ message: '$property| precisa ser inteiro' })
    orgao_id: number

    /**
    * @example "1"
    */
    @IsInt({ message: '$property| precisa ser inteiro' })
    @IsPositive({ message: '$property| precisa ser positivo' })
    nivel: number

    /**
    * @example "1"
    */
    @IsInt({ message: '$property| precisa ser inteiro' })
    @IsPositive({ message: '$property| precisa ser positivo' })
    numero: number

    @IsInt({ message: '$property| precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    tarefa_pai_id: number | null

    /**
    * @example "task"
    */
    @IsString({ message: '$property| precisa ser um texto' })
    @MinLength(1)
    @MaxLength(60)
    tarefa: string

    /**
    * @example "doing x at place zoo"
    */
    @IsString({ message: '$property| precisa ser um texto, mesmo que vazio' })
    @MinLength(0)
    @MaxLength(2048)
    descricao: string


    /**
    * @example "pessoa foo; pessoa bar"
    */
    @IsString({ message: '$property| precisa ser um texto, mesmo que vazio' })
    @MinLength(0)
    @MaxLength(2048)
    recursos: string

    /**
     * @example 2020-01-01
     */
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    inicio_planejado: Date | null

    /**
    * @example 2020-01-01
    */
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    termino_planejado: Date | null

    /**
    * @example 0
    */
    @IsInt({ message: '$property| precisa ser inteiro' })
    @Min(1)
    @ValidateIf((object, value) => value !== null)
    duracao_planejado: number | null

    /**
    * @example 2020-01-01
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    inicio_real?: Date | null

    /**
    * @example 2020-01-01
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    termino_real?: Date | null

    @IsOptional()
    @IsInt({ message: '$property| precisa ser inteiro' })
    @Min(1)
    @ValidateIf((object, value) => value !== null)
    duracao_real?: number | null

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| máximo 2 casas decimais' })
    @ValidateIf((object, value) => value !== null)
    custo_estimado?: number | null

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| máximo 2 casas decimais' })
    @ValidateIf((object, value) => value !== null)
    custo_real?: number | null

    @IsOptional()
    @IsArray({ message: '$property| precisa ser do tipo array ou null' })
    @ValidateNested({ each: true })
    @Type(() => TarefaDependenciaDto)
    @ValidateIf((object, value) => value !== null)
    dependencias?: TarefaDependenciaDto[] | null;

    @IsOptional()
    @IsInt({ message: '$property| precisa ser inteiro' })
    @Min(0, { message: '$property| Mínimo 0' })
    @ValidateIf((object, value) => value !== null)
    percentual_concluido?: number | null
}
