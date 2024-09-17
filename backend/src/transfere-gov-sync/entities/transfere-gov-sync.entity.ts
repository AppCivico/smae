import { ComunicadoTipo, TransfereGovOportunidadeAvaliacao, TransfereGovOportunidadeTipo } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { ApiProperty } from '@nestjs/swagger';

export class TransfereGovDto {
    id: number;
    numero: number;
    ano: number;
    titulo: string;
    link: string;
    publicado_em: Date;
    descricao: string | null;
    tipo: ComunicadoTipo;
}

export class FilterTransfereGovListDto {
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_inicio?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_fim?: Date;

    @IsOptional()
    @IsString()
    token_proxima_pagina?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Max(1000)
    @Min(1)
    ipp?: number = 25;

    @IsOptional()
    @IsEnum(ComunicadoTipo)
    tipo?: ComunicadoTipo;
}

export class TransfereGovSyncDto {
    novos_itens: number[];
}

export class TransfereGovTransferenciasDto {
    id: number;
    tipo: TransfereGovOportunidadeTipo;
    avaliacao: TransfereGovOportunidadeAvaliacao | null;
    cod_orgao_sup_programa: string;
    desc_orgao_sup_programa: string;
    cod_programa: string;
    nome_programa: string;
    sit_programa: string;
    ano_disponibilizacao: number;
    data_disponibilizacao: Date;
    dt_ini_receb: Date;
    dt_fim_receb: Date;
    modalidade_programa: string;
    acao_orcamentaria: string;
}

export class FilterTransfereGovTransferenciasDto {
    @IsOptional()
    @IsString()
    token_proxima_pagina?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Max(1000)
    @Min(1)
    ipp?: number = 25;

    @IsOptional()
    @IsEnum(TransfereGovOportunidadeTipo)
    @ApiProperty({ enum: TransfereGovOportunidadeTipo, enumName: 'TransfereGovOportunidadeTipo' })
    tipo?: TransfereGovOportunidadeTipo;

    @IsOptional()
    @IsNumber()
    ano?: number;

    @IsOptional()
    @IsString()
    palavras_chave?: string;
}

export class UpdateTransfereGovTransferenciaDto {
    @IsOptional()
    @IsEnum(TransfereGovOportunidadeAvaliacao)
    avaliacao?: TransfereGovOportunidadeAvaliacao;
}
