import { ApiProperty, PickType } from '@nestjs/swagger';
import { ModuloSistema } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCTPConfigDto {
    @IsEnum(ModuloSistema)
    @ApiProperty({ enumName: 'ModuloSistema', enum: ModuloSistema })
    modulo_sistema: ModuloSistema;

    @IsEmail()
    @MaxLength(255, {message: 'O campo "Para" deve ter no máximo 255 caracteres'})
    para: string;

    @IsString()
    @MaxLength(255, {message: 'O campo "Texto inicial" deve ter no máximo 255 caracteres'})
    texto_inicial: string;

    @IsString()
    @MaxLength(255, {message: 'O campo "Texto final" deve ter no máximo 255 caracteres'})
    texto_final: string;

    @IsString()
    @MinLength(1)
    @MaxLength(255, {message: 'O campo "Assunto global" deve ter no máximo 255 caracteres'})
    assunto_global: string;

    @IsString()
    @MinLength(1)
    @MaxLength(255, {message: 'O campo "Assunto orgão" deve ter no máximo 255 caracteres'})
    assunto_orgao: string;
}

export class FilterCTPConfigDto extends PickType(UpdateCTPConfigDto, ['modulo_sistema']) {}
