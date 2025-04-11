import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { ModuloSistema } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { NumberTransform } from '../../../auth/transforms/number.transform';

export class CreateTipoNotaDto {
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo 1 caracteres' })
    @MaxLength(100, { message: '$property| descrição: Máximo 100 caracteres' })
    codigo: string;

    @IsBoolean()
    permite_revisao: boolean;

    @IsBoolean()
    visivel_resp_orgao: boolean;

    @IsBoolean()
    eh_publico: boolean;

    @IsBoolean()
    permite_enderecamento: boolean;

    @IsBoolean()
    permite_email: boolean;

    @IsBoolean()
    permite_replica: boolean;

    @IsArray()
    @ApiProperty({ isArray: true, enum: ModuloSistema, enumName: 'ModuloSistema' })
    @IsEnum(ModuloSistema, { each: true })
    modulos: ModuloSistema[];
}

export class UpdateTipoNotaDto extends OmitType(PartialType(CreateTipoNotaDto), []) {}

export class ListTipoNotaDto {
    linhas: TipoNotaItem[];
}

export class TipoNotaItem {
    id: number;
    codigo: string;
    permite_email: boolean;
    permite_enderecamento: boolean;
    permite_replica: boolean;
    permite_revisao: boolean;
    visivel_resp_orgao: boolean;
    eh_publico: boolean;
    @ApiProperty({ isArray: true, enum: ModuloSistema, enumName: 'ModuloSistema' })
    modulos: ModuloSistema[];
}

export class FilterTipoNota {
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    id?: number;
}
