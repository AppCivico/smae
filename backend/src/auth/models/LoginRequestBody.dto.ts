import { IsEmail, IsString } from 'class-validator';

export class LoginRequestBody {
    /**
     * E-mail para login
     * @example "admin@email.com"
     */
    @IsEmail(undefined, { message: 'E-mail: Precisa ser um endereço válido' })
    email: string;

    /**
     * Senha
     * @example "Teste*123"
     */
    @IsString({ message: 'Senha: Precisa ser alfanumérico' })
    senha: string;
}
