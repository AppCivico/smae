import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo } from 'src/generated/prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';
import { IsValidCPF } from '../../common/decorators/IsValidCPF';

export class FilterParlamentarDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    /**
     * token pra buscar proxima pagina
     */
    token_proxima_pagina?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    palavra_chave?: string;
    /**
     * itens por pagina, padrão 50
     * @example "50"
     */
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(-1)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    ipp?: number;

    @IsOptional()
    @IsNumber()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    partido_id?: number;

    @IsOptional()
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    @IsEnum(ParlamentarCargo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ParlamentarCargo).join(', '),
    })
    cargo?: ParlamentarCargo;

    @IsOptional()
    @IsNumber()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    disponivel_para_suplente_parlamentar_id?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    possui_mandatos?: boolean;

    @IsOptional()
    @IsValidCPF()
    @ValidateIf((object, value) => value)
    cpf?: string;
}
