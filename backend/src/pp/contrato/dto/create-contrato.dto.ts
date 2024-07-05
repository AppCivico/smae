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
} from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { Transform } from 'class-transformer';

export class CreateContratoDto {
    @IsString()
    @MinLength(1)
    @MaxLength(500)
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
        message: '$property| Fontes de recurso: precisa ser uma array de números inteiros',
    })
    @ArrayMaxSize(100, {
        message: '$property| Fontes de recurso: precisa ter no máximo 100 items',
    })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    fontes_recurso_ids: number[];

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
    @MaxLength(500)
    objeto_resumo?: string;

    @IsOptional()
    @MinLength(1)
    @MaxLength(50000)
    objeto_detalhado?: string;

    @IsOptional()
    @MinLength(1)
    @MaxLength(500)
    contratante?: string;

    @IsOptional()
    @MinLength(1)
    @MaxLength(500)
    empresa_contratada?: string;

    @IsOptional()
    @MinLength(14)
    @MaxLength(14)
    cnpj_contratada?: string;

    @IsOptional()
    @MinLength(1)
    @MaxLength(5000)
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
    @IsInt()
    prazo_numero?: number;

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