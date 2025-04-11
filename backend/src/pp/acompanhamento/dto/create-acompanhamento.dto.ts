import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';

export class ProjetoAcompanhamentoDto {
    @IsOptional()
    @IsInt({ message: '$property| id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    id?: number;

    @IsString()
    @MinLength(1)
    @MaxLength(50000)
    encaminhamento: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    responsavel?: string;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    prazo_encaminhamento?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    prazo_realizado?: Date;
}

export class CreateProjetoAcompanhamentoDto {
    @IsOptional()
    @IsString()
    @MaxLength(50000)
    pauta?: string;

    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_registro: Date;

    @IsString()
    @MaxLength(2048)
    participantes: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    detalhamento?: string;

    @IsOptional()
    @IsArray({ message: 'acompanhamentos precisa ser uma array, campo obrigatório' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @ValidateNested({ each: true })
    @Type(() => ProjetoAcompanhamentoDto)
    acompanhamentos?: ProjetoAcompanhamentoDto[];

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    observacao?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    detalhamento_status?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    pontos_atencao?: string;

    @IsOptional()
    @IsBoolean()
    cronograma_paralisado?: boolean;

    //@IsOptional()
    //@IsString()
    //risco_tarefa_outros?: string

    /**
     * enviar array dos ids dos projeto-risco-id array vazia ou nulo para remover
     * @example "[]"
     */
    @IsOptional()
    @IsArray({ message: '$property| risco(s): precisa ser uma array ou.' })
    @ArrayMinSize(0, { message: '$property| risco(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| risco(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @ValidateIf((object, value) => value !== null)
    risco?: number[] | null;

    /**
     * acompanhamento_tipo_id
     */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    acompanhamento_tipo_id?: number | null;

    @IsOptional()
    @IsBoolean()
    apresentar_no_relatorio: boolean;
}
