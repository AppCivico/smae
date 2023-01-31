import { IsEmail, IsString } from 'class-validator';

export class LoginRequestBody {
    /**
     * E-mail para login
     * @example "admin@email.com"
     */
    @IsEmail(undefined, { message: '$property| E-mail: Precisa ser um endereço válido' })
    email: string;

    /**
     * Senha
     * @example "Teste*123"
     */
    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    senha: string;
}
