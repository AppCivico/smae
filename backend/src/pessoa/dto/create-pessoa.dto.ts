import { Pessoa } from '../entities/pessoa.entity';

import {
    IsArray,
    IsEmail,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreatePessoaDto extends Pessoa {
    /**
   * E-mail para login
   * @example admin@email.com
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
       * @example Fulano de Zo
    */
    @IsString({ message: '$property| Nome Completo: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Nome Completo: Mínimo de 4 caracteres' })
    @MaxLength(250, { message: '$property| Nome Completo: Máximo 250 caracteres' })
    nome_completo: string;

    /**
       * Coordenadoria/Cargo/Etc
       * @example 1
    */
    @IsOptional()
    @IsString({ message: '$property| Lotação: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| Lotação: Mínimo de 1 caracteres' })
    @MaxLength(250, { message: '$property| Lotação: Máximo 250 caracteres' })
    lotacao?: string;

    /**
       * ID Órgão
       * @example 1
    */
    @IsPositive()
    @IsOptional()
    orgao_id?: number;

    /**
       * Lista dos IDs do perfil de acesso
       * @example [1, 2]
    */
    @IsArray({ message: '$property| está inválido' })
    perfil_acesso_ids: number[];
}