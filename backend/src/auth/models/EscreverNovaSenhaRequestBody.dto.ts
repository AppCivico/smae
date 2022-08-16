import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class EscreverNovaSenhaRequestBody {
    /**
    * Access Token
    * @example admin@email.com
    */
    @IsString({ message: '$property| Precisa do token' })
    reduced_access_token: string;

    /**
    * Senha
    * @example Teste*123
    */
    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    @MinLength(8, { message: '$property| Senha: Mínimo de 8 caracteres' })
    @MaxLength(1000, { message: '$property| Senha: Máximo de 1000 caracteres' })
    @Matches(/((?=.*\d)|(?=.*\W+)|(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]))(?![.\n])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-z]).*$/, {
        message: '$property| Senha: Precisa ter pelo menos 1 número e um caractere em caixa alta e um dos seguintes caracteres especiais: !@#$%^&*()_+-=\\[]{};\':"\\|,.<>/?',
    })
    senha: string;
}