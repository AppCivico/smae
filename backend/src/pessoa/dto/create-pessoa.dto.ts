import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
} from 'class-validator';
import { IsValidCPF } from '../../common/decorators/IsValidCPF';
import { ModuloSistema } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreatePessoaDto {
    /**
     * E-mail para login
     * @example "admin@email.com"
     */
    @MinLength(1, { message: '$property| E-mail: Mínimo de 1 caractere' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'E-mail' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @IsEmail(undefined, { message: '$property| E-mail: Precisa ser um endereço válido' })
    email: string;

    /**
     * Nome para exibir no app
     * @example Fulano
     */
    @IsString({ message: '$property| Nome Social: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| Nome Social: Mínimo de 1 caracteres' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome exibição' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome_exibicao: string;

    /**
     * Nome completo
     * @example "Fulano de Zo"
     */
    @IsString({ message: '$property| Nome Completo: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Nome Completo: Mínimo de 4 caracteres' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome completo' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome_completo: string;

    /**
     * Coordenadoria/
     * @example Bar
     */
    @IsOptional()
    @IsString({ message: '$property| Lotação: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Lotação' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    lotacao?: string;

    /**
     * Cargo
     * @example Coordenador
     */
    @IsOptional()
    @IsString({ message: '$property| Cargo: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Cargo' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    cargo?: string;

    /**
     * ID Órgão
     * @example 1
     */
    @IsOptional()
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    orgao_id?: number;

    /**
     * Lista dos IDs do perfil de acesso
     * @example "[1, 2]"
     */
    @IsArray({ message: '$property| está inválido' })
    perfil_acesso_ids: number[];

    /**
     * registro_funcionario
     * @example \d{3}\.\d{3}\-\d
     */
    @IsOptional()
    @IsString({ message: '$property| Registro_funcionario: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Registro funcionário' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    registro_funcionario?: string;

    /**
     * cpf
     * @example xxx.xxx.xxx-xx
     */
    @IsOptional()
    @IsValidCPF()
    @ValidateIf((object, value) => value)
    cpf?: string;

    /**
     * Lista dos IDs dos grupo de painel, PDM
     */
    @IsArray()
    @IsOptional()
    @ArrayMaxSize(100, { message: '$property| grupo(s): precisa ter no máximo 100 items' })
    grupos?: number[];

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(100, { message: '$property| grupo(s): precisa ter no máximo 100 items' })
    equipes?: number[];

    @IsOptional()
    @IsBoolean()
    sobreescrever_modulos?: boolean;

    @IsOptional()
    @IsArray()
    @IsEnum(ModuloSistema, { each: true })
    @ApiProperty({ type: 'array', enum: ModuloSistema })
    modulos_permitidos?: ModuloSistema[];
}
