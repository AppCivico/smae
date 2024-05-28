import { ApiProperty } from '@nestjs/swagger';
import { TipoProjeto } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, Validate } from 'class-validator';
import { EitherPdmOrPortfolio } from 'src/common/dto/EitherPdmOrPortfolio';

export class CreateImportacaoOrcamentoDto {
    /**
     * Upload do XLSX, XLS, CSV, etc...
     *
     * see: https://docs.sheetjs.com/docs/miscellany/formats
     *
     */
    @IsString({ message: '$property| upload_token de um arquivo de ícone' })
    upload: string;

    @ApiProperty({ example: 0 })
    @Validate(EitherPdmOrPortfolio)
    @Type(() => Number)
    pdm_id: number | undefined;

    @IsOptional()
    @IsEnum(TipoProjeto)
    @ApiProperty({ enum: TipoProjeto, enumName: 'TipoProjeto', default: TipoProjeto.PP })
    tipo_projeto?: TipoProjeto;

    @ApiProperty({ example: 0 })
    @Validate(EitherPdmOrPortfolio)
    @Type(() => Number)
    portfolio_id: number | undefined;
}

export class FilterImportacaoOrcamentoDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    pdm_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    portfolio_id?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    apenas_com_portfolio?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    /**
     * token pra buscar proxima pagina
     */
    token_proxima_pagina?: string;

    /**
     * itens por pagina, padrão 25
     * @example "25"
     */
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    ipp?: number;
}
