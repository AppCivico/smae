import { DemandaFinalidade } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    arrayMinSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsNumberStringCustom } from 'src/common/decorators/IsNumberStringCustom';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from '../../../common/consts';
import { ApiProperty } from '@nestjs/swagger';

export const DemandaAcao = {
    editar: 'editar',
    enviar: 'enviar',
    validar: 'validar',
    devolver: 'devolver',
    cancelar: 'cancelar',
} as const;

export type DemandaAcao = (typeof DemandaAcao)[keyof typeof DemandaAcao];

export class CreateDemandaArquivoDto {
    @IsOptional()
    @IsInt()
    id?: number;

    @ValidateIf((a) => !a.id)
    @IsString()
    @IsNotEmpty()
    upload_token: string;

    @IsBoolean()
    autoriza_divulgacao: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    descricao?: string;
}

export class CreateDemandaDto {
    @IsInt()
    orgao_id: number;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    unidade_responsavel: string;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    nome_responsavel: string;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    cargo_responsavel: string;

    @IsEmail()
    @MaxLength(MAX_LENGTH_DEFAULT)
    email_responsavel: string;

    @IsString()
    @MaxLength(20)
    telefone_responsavel: string;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    nome_projeto: string;

    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    descricao: string;

    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    justificativa: string;

    @IsNumberStringCustom(13, 2)
    valor: string;

    @IsEnum(DemandaFinalidade)
    @ApiProperty({ enum: DemandaFinalidade, enumName: 'DemandaFinalidade' })
    finalidade: DemandaFinalidade;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    observacao?: string;

    @IsInt()
    area_tematica_id: number;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    acao_ids?: number[];

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1, { message: 'Pelo menos uma localização deve ser informada.' })
    @IsString({ each: true })
    localizacoes?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDemandaArquivoDto)
    arquivos?: CreateDemandaArquivoDto[];

    @ApiProperty({ enum: DemandaAcao, enumName: 'DemandaAcao', required: false })
    @IsOptional()
    @IsEnum(DemandaAcao, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(DemandaAcao).join(', '),
    })
    acao?: DemandaAcao;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    motivo?: string;
}

export class UpdateDemandaDto {
    @IsOptional()
    @IsInt()
    orgao_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    unidade_responsavel?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    nome_responsavel?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    cargo_responsavel?: string;

    @IsOptional()
    @IsEmail()
    @MaxLength(MAX_LENGTH_DEFAULT)
    email_responsavel?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    telefone_responsavel?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    nome_projeto?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    descricao?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    justificativa?: string;

    @IsOptional()
    @IsNumberStringCustom(13, 2)
    valor?: string;

    @IsOptional()
    @IsEnum(DemandaFinalidade)
    finalidade?: DemandaFinalidade;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    observacao?: string;

    @IsOptional()
    @IsInt()
    area_tematica_id?: number;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    acao_ids?: number[];

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1, { message: 'Pelo menos uma localização deve ser informada.' })
    @IsString({ each: true })
    localizacoes?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDemandaArquivoDto)
    arquivos?: CreateDemandaArquivoDto[];
}
