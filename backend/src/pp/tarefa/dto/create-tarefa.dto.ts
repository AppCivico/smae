import { ApiProperty } from '@nestjs/swagger';
import { TarefaDependenteTipo } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { GraphvizServiceFormat } from 'src/graphviz/graphviz.service';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CustoAnualizadoDto {
    @Expose()
    @IsInt({ message: 'Ano precisa ser inteiro' })
    @Min(1900, { message: 'Ano mínimo é 1900' })
    @Max(2100, { message: 'Ano máximo é 2100' })
    ano: number;

    @Expose()
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: 'Valor: máximo 2 casas decimais' }
    )
    @Min(0, { message: 'Valor deve ser maior ou igual a zero' })
    valor: number;
}

export class TarefaDependenciaDto {
    @IsInt({ message: 'precisa ser inteiro' })
    dependencia_tarefa_id: number;

    @ApiProperty({ enum: TarefaDependenteTipo, enumName: 'TarefaDependenteTipo' })
    @IsEnum(TarefaDependenteTipo, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(TarefaDependenteTipo).join(', '),
    })
    tipo: TarefaDependenteTipo;

    @IsInt({ message: 'precisa ser inteiro' })
    latencia: number;
}

export class CheckDependenciasDto {
    @IsInt({ message: 'precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    tarefa_corrente_id: number | null;

    @Type(() => TarefaDependenciaDto)
    @IsArray({ message: 'precisa ser uma array, campo obrigatório' })
    @ValidateNested({ each: true })
    @ValidateIf((object, value) => value !== null)
    @ApiProperty({ required: true }) // é required, só no JS que não é
    dependencias?: TarefaDependenciaDto[] | null;
}

export class CreateTarefaDto {
    @IsInt({ message: 'precisa ser inteiro' })
    orgao_id: number;

    /**
     * @example "1"
     */
    @IsInt({ message: 'precisa ser inteiro' })
    @IsPositive({ message: 'precisa ser positivo' })
    @Max(32, { message: 'Máximo 32' })
    nivel: number;

    /**
     * @example "1"
     */
    @IsInt({ message: 'precisa ser inteiro' })
    @IsPositive({ message: 'precisa ser positivo' })
    @Max(99999, { message: 'Máximo 99999' })
    numero: number;

    @IsInt({ message: 'precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    @Transform(({ value }: any) => (value === '' || value === null ? null : +value))
    tarefa_pai_id: number | null;

    /**
     * @example "task"
     */
    @IsString({ message: 'precisa ser um texto' })
    @MinLength(1, { message: 'Tamanho Mínimo 1' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Tarefa' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    tarefa: string;

    /**
     * @example "doing x at place zoo"
     */
    @IsString({ message: 'precisa ser um texto, mesmo que vazio' })
    @MinLength(0)
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;

    /**
     * @example "pessoa foo; pessoa bar"
     */
    @IsString({ message: 'precisa ser um texto, mesmo que vazio' })
    @MinLength(0)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Recursos' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    recursos: string;

    /**
     * @example 2020-01-01
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    inicio_planejado?: Date | null;

    /**
     * @example 2020-01-01
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    termino_planejado?: Date | null;

    /**
     * @example 0
     */
    @IsOptional()
    @IsInt({ message: 'precisa ser inteiro' })
    @Min(1, { message: 'Mínimo 1' })
    @ValidateIf((object, value) => value !== null)
    @Transform(({ value }: any) => (String(value) === '0' || value === null ? null : +value))
    duracao_planejado?: number | null;

    /**
     * @example 2020-01-01
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    inicio_real?: Date | null;

    /**
     * @example 2020-01-01
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    termino_real?: Date | null;

    @IsOptional()
    @IsInt({ message: 'precisa ser inteiro' })
    @Min(1)
    @ValidateIf((object, value) => value !== null)
    duracao_real?: number | null;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: 'máximo 2 casas decimais' })
    @ValidateIf((object, value) => value !== null)
    custo_estimado?: number | null;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: 'máximo 2 casas decimais' })
    @ValidateIf((object, value) => value !== null)
    custo_real?: number | null;

    @IsOptional()
    @IsArray({ message: 'precisa ser do tipo array ou null' })
    @ValidateNested({ each: true })
    @Type(() => TarefaDependenciaDto)
    @ValidateIf((object, value) => value !== null)
    dependencias?: TarefaDependenciaDto[] | null;

    @IsOptional()
    @IsInt({ message: 'precisa ser inteiro' })
    @Min(0, { message: 'Mínimo 0' })
    @ValidateIf((object, value) => value !== null)
    percentual_concluido?: number | null;

    /**
     * se é a tarefa é um marco ou não no projeto
     * @example "false"
     */
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    @ValidateIf((object, value) => value !== null)
    eh_marco?: boolean;

    @IsOptional()
    @IsArray({ message: 'custo_estimado_anualizado precisa ser um array' })
    @ValidateNested({ each: true })
    @Type(() => CustoAnualizadoDto)
    @ValidateIf((object, value) => value !== null)
    custo_estimado_anualizado?: CustoAnualizadoDto[] | null;

    @IsOptional()
    @IsArray({ message: 'custo_real_anualizado precisa ser um array' })
    @ValidateNested({ each: true })
    @Type(() => CustoAnualizadoDto)
    @ValidateIf((object, value) => value !== null)
    custo_real_anualizado?: CustoAnualizadoDto[] | null;
}

export class FilterPPTarefa {}

export class FilterEAPDto {
    @IsOptional()
    @ApiProperty({
        enum: GraphvizServiceFormat,
        enumName: 'GraphvizServiceFormat',
        example: 'png',
        description: 'padrão é PNG',
    })
    @IsEnum(GraphvizServiceFormat, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(GraphvizServiceFormat).join(', '),
    })
    formato?: GraphvizServiceFormat;
}

export class TarefaCronogramaInput {
    tarefa_cronograma_id?: number;
    projeto_id?: number;
    transferencia_id?: number;
}
