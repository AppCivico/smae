import { ApiProperty, PickType } from '@nestjs/swagger';
import { ModuloSistema } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_HTML } from 'src/common/consts';

export class UpdateCTPConfigDto {
    @IsEnum(ModuloSistema)
    @ApiProperty({ enumName: 'ModuloSistema', enum: ModuloSistema })
    modulo_sistema: ModuloSistema;

    @IsEmail()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Para' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    para: string;

    @IsString()
    @MaxLength(MAX_LENGTH_HTML, { message: `O campo 'Texto inicial' deve ter no máximo ${MAX_LENGTH_HTML} caracteres` })
    texto_inicial: string;

    @IsString()
    @MaxLength(MAX_LENGTH_HTML, { message: `O campo 'Texto final' deve ter no máximo ${MAX_LENGTH_HTML} caracteres` })
    texto_final: string;

    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Assunto global' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    assunto_global: string;

    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Assunto orgão' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    assunto_orgao: string;
}

export class FilterCTPConfigDto extends PickType(UpdateCTPConfigDto, ['modulo_sistema']) {}
