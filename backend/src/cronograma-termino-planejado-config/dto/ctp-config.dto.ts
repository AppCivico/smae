import { ApiProperty, PickType } from '@nestjs/swagger';
import { ModuloSistema } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCTPConfigDto {
    @IsEnum(ModuloSistema)
    @ApiProperty({ enumName: 'ModuloSistema', enum: ModuloSistema })
    modulo_sistema: ModuloSistema;

    @IsEmail()
    @MaxLength(100)
    para: string;

    @IsString()
    @MaxLength(5000)
    texto_inicial: string;

    @IsString()
    @MaxLength(5000)
    texto_final: string;

    @IsString()
    @MinLength(1)
    @MaxLength(240)
    assunto_global: string;

    @IsString()
    @MinLength(1)
    @MaxLength(240)
    assunto_orgao: string;
}

export class FilterCTPConfigDto extends PickType(UpdateCTPConfigDto, ['modulo_sistema']) {}
