import { ApiProperty } from '@nestjs/swagger';
import { ContratoPrazoUnidade, StatusContrato } from '@prisma/client';
import {
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumberString,
    ValidateIf,
    IsArray,
    ArrayMaxSize,
    ValidateNested,
} from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { Transform, Type } from 'class-transformer';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateContratoDto {
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Número' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    numero: string;

    @IsBoolean({ message: '$property| precisa ser um boolean' })
    contrato_exclusivo: boolean;

    @ApiProperty({
        description: 'Status do contrato',
        enum: StatusContrato,
        enumName: 'StatusContrato',
    })
    @IsEnum(StatusContrato)
    status: StatusContrato;

    @IsOptional()
    @IsInt()
    modalidade_contratacao_id?: number;

    @IsOptional()
    @IsInt()
    orgao_id?: number;

    @IsArray({
        message: '$property| Fontes de recurso: precisa ser uma array de strings',
    })
    @ArrayMaxSize(100, {
        message: '$property| Fontes de recurso: precisa ter no máximo 100 items',
    })
    @ValidateNested({ each: true })
    @Type(() => CreateContratoFonteRecursoDto)
    fontes_recurso: CreateContratoFonteRecursoDto[];

    @IsArray({
        message: '$property| Processos SEI: precisa ser uma array de strings',
    })
    @ArrayMaxSize(100, {
        message: '$property| Processos SEI: precisa ter no máximo 100 items',
    })
    @IsString({ each: true, message: '$property| Cada item precisa ser uma string' })
    processos_sei: string[];

    @IsOptional()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Objeto Resumo" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    objeto_resumo?: string;

    @IsOptional()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Objeto Detalhado" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    objeto_detalhado?: string;

    @IsOptional()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Contratante' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    contratante?: string;

    @IsOptional()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Empresa contratada' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    empresa_contratada?: string;

    @IsOptional()
    @MinLength(14)
    @MaxLength(14)
    @IsNumberString(
        {},
        {
            message: '$property| Precisa ser número de CNPJ com 14 dígitos, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    cnpj_contratada?: string;

    @IsOptional()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Observacões" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    observacoes?: string;

    @IsOptional()
    @Transform(DateTransform)
    @IsOnlyDate()
    data_assinatura?: Date;

    @IsOptional()
    @Transform(DateTransform)
    @IsOnlyDate()
    data_inicio?: Date;

    @IsOptional()
    @Transform(DateTransform)
    @IsOnlyDate()
    data_termino?: Date;

    @IsOptional()
    @IsInt()
    prazo_numero?: number;

    @IsOptional()
    @ApiProperty({
        description: 'Unidade do valor do prazo',
        enum: ContratoPrazoUnidade,
        enumName: 'ContratoPrazoUnidade',
    })
    @IsEnum(ContratoPrazoUnidade)
    prazo_unidade?: ContratoPrazoUnidade;

    @IsOptional()
    @IsInt()
    data_base_mes?: number;

    @IsOptional()
    @IsInt()
    data_base_ano?: number;

    @IsOptional()
    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor?: string;
}

export class CreateContratoFonteRecursoDto {
    @IsString()
    fonte_recurso_cod_sof: string;

    @IsInt()
    fonte_recurso_ano: number;
}
