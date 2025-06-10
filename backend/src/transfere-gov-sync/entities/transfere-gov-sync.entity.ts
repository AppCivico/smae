import { ComunicadoTipo, TransfereGovOportunidadeAvaliacao, TransfereGovOportunidadeTipo } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateYMD } from '../../auth/decorators/date.decorator';

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
    natureza_juridica_programa: string;
    id_programa: bigint;
    cod_orgao_sup_programa: bigint | null;
    desc_orgao_sup_programa: string | null;
    cod_programa: bigint;
    nome_programa: string;
    sit_programa: string;
    ano_disponibilizacao: number | null;
    @IsDateYMD({ nullable: true })
    data_disponibilizacao: string | null;
    @IsDateYMD({ nullable: true })
    dt_ini_receb: string | null;
    @IsDateYMD({ nullable: true })
    dt_fim_receb: string | null;
    modalidade_programa: string;
    acao_orcamentaria: string;
}

export enum AvaliacaoFilter {
    NaoSeAplica = 'NaoSeAplica',
    Selecionada = 'Selecionada',
    NaoAvaliada = 'NaoAvaliada',
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
    @Type(() => Number)
    ano?: number;

    @IsOptional()
    @IsString()
    palavras_chave?: string;

    @IsOptional()
    @IsEnum(AvaliacaoFilter)
    @ApiProperty({ enum: AvaliacaoFilter, enumName: 'AvaliacaoFilter' })
    avaliacao?: AvaliacaoFilter;
}

export class UpdateTransfereGovTransferenciaDto {
    @IsOptional()
    @IsEnum(TransfereGovOportunidadeAvaliacao)
    @ApiProperty({ enum: TransfereGovOportunidadeAvaliacao, enumName: 'TransfereGovOportunidadeAvaliacao' })
    avaliacao?: TransfereGovOportunidadeAvaliacao;
}
