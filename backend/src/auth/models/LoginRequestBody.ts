import { IsEmail, IsString } from 'class-validator';

export class LoginRequestBody {
    @IsEmail(undefined, { message: '$property| E-mail: Precisa ser um endereço válido' })
    email: string;

    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    senha: string;
}