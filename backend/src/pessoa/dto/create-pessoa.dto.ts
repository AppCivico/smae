import { Pessoa } from '../entities/pessoa.entity';

import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePessoaDto {
    /**
   * E-mail para login
   * @example "admin@email.com"
    */
    @MinLength(1, { message: '$property| E-mail: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| E-mail: Máximo 250 caracteres' })
    @IsEmail(undefined, { message: '$property| E-mail: Precisa ser um endereço válido' })
    email: string;

    /**
       * Nome para exibir no app
       * @example Fulano
    */
    @IsString({ message: '$property| Nome Social: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Nome Social: Mínimo de 4 caracteres' })
    @MaxLength(30, { message: '$property| Nome Social: Máximo 30 caracteres' })
    nome_exibicao: string;

    /**
       * Nome completo
       * @example "Fulano de Zo"
    */
    @IsString({ message: '$property| Nome Completo: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Nome Completo: Mínimo de 4 caracteres' })
    @MaxLength(250, { message: '$property| Nome Completo: Máximo 250 caracteres' })
    nome_completo: string;

    /**
       * Coordenadoria/
       * @example Bar
    */
    @IsOptional()
    @IsString({ message: '$property| Lotação: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Lotação: Máximo 250 caracteres' })
    lotacao?: string;

    /**
       * Cargo
       * @example Coordenador
    */
    @IsOptional()
    @IsString({ message: '$property| Cargo: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Cargo: Máximo 250 caracteres' })
    cargo?: string;

    /**
       * ID Órgão
       * @example 1
    */
    @IsOptional()
    @IsPositive({ message: '$property| precisa ser um número' })
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
    @MaxLength(9, { message: '$property| registro_funcionario: Máximo 9 caracteres' })
    registro_funcionario?: string;

    /**
       * cpf
       * @example xxx.xxx.xxx-xx
    */
    @IsOptional()
    @IsString({ message: '$property| cpf: Precisa ser alfanumérico' })
    @MaxLength(14, { message: '$property| cpf: Máximo 14 caracteres' })
    cpf?: string;

    @IsArray()
    @IsOptional()
    @ArrayMinSize(1, { message: '$property| grupo(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| grupo(s): precisa ter no máximo 100 items' })
    grupos?: number[]
}