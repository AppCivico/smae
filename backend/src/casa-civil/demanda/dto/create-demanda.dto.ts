import { DemandaFinalidade } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { IsNumberStringCustom } from 'src/common/decorators/IsNumberStringCustom';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from '../../../common/consts';

export class CreateDemandaLocalizacaoDto {
    @IsOptional()
    @IsInt()
    id?: number;

    @IsOptional()
    @IsString()
    geolocalizacao_token: string;
}

export class CreateDemandaArquivoDto {
    @IsOptional()
    @IsInt()
    id?: number;

    @IsString()
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
    finalidade: DemandaFinalidade;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    observacao?: string;

    @IsInt()
    area_tematica_id: number;

    @IsArray()
    @IsInt({ each: true })
    @ArrayMinSize(1)
    acao_ids: number[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDemandaLocalizacaoDto)
    @ArrayMinSize(1)
    localizacoes: CreateDemandaLocalizacaoDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDemandaArquivoDto)
    arquivos?: CreateDemandaArquivoDto[];
}
