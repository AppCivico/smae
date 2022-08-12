import { Pessoa } from '../entities/pessoa.entity';

import {
    IsEmail,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
export class CreatePessoaDto extends Pessoa {
    @MinLength(1, { message: '$property| E-mail: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| E-mail: Máximo 250 caracteres' })
    @IsEmail(undefined, { message: '$property| E-mail: Precisa ser um endereço válido' })
    email: string;

    @IsString({ message: '$property| Nome Exibição: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Nome Exibição: Mínimo de 4 caracteres' })
    @MaxLength(30, { message: '$property| Nome Exibição: Máximo 30 caracteres' })
    nome_exibicao: String;

    @IsString({ message: '$property| Nome Completo: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Nome Completo: Mínimo de 4 caracteres' })
    @MaxLength(250, { message: '$property| Nome Completo: Máximo 250 caracteres' })
    nome_completo: String;

    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    @MinLength(6, { message: '$property| Senha: Mínimo de 6 caracteres' })
    @MaxLength(1000, { message: '$property| Senha: Máximo de 1000 caracteres' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: '$property| Senha: Precisa ter pelo menos 1 número e um caractere em caixa alta',
    })
    senha: string;
}

