import { Pessoa } from '../entities/pessoa.entity';

import {
    IsEmail,
    IsString,
    Matches,
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
       * Senha para login
       * pelo menos 8 caracteres, 1 caractere em caixa alta e um número
       * um dos seguintes caracteres: !@#$%^&*()_+-=\[]{};':"\|,.<>/?
       * - senha não expira, mas bloqueia a conta após 3 tentativas e enviar nova senha por email
       * @example Testes*1
    */
    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    @MinLength(8, { message: '$property| Senha: Mínimo de 8 caracteres' })
    @MaxLength(1000, { message: '$property| Senha: Máximo de 1000 caracteres' })
    @Matches(/((?=.*\d)|(?=.*\W+)|(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]))(?![.\n])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-z]).*$/, {
        message: '$property| Senha: Precisa ter pelo menos 1 número e um caractere em caixa alta e um dos seguintes caracteres especiais: !@#$%^&*()_+-=\\[]{};\':"\\|,.<>/?',
    })
    senha: string;
}

