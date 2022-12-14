import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const MESSAGE = '$property| Senha: Precisa ter pelo menos 6 caracteres, 1 número e um caractere em CAIXA ALTA e um dos seguintes caracteres especiais: !, @, #, $, %, ^, &, *, (, ), _, +, -, =, [, ], {, }, ;, \', :, ", \, |, ,, ., <, >, /, ?';
export const REGEXP = /^((?=.*\d)|(?=.*\W+)|(?=.*[\!\@\#\$\%\^\&\*\(\)\_\+\-\=\[\]\{\}\;\'\:\"\\\|\,\.\<\>\/\?]))(?![.\n])(?=.*[A-Z])(?=.*[\!\@\#\$\%\^\&\*\(\)\_\+\-\=\[\]\{\}\;\'\:\"\\\|\,\.\<\>\/\?])(?=.*[a-z]).*$/;
export class EscreverNovaSenhaRequestBody {
    /**
    * Access Token
    * @example "header.auth.sign"
    */
    @IsString({ message: '$property| Precisa do token' })
    reduced_access_token: string;

    /**
    * Senha
    * @example "Teste*123"
    */
    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    @MinLength(8, { message: '$property| Senha: Mínimo de 8 caracteres' })
    @MaxLength(1000, { message: '$property| Senha: Máximo de 1000 caracteres' })
    @Matches(REGEXP, {
        message: MESSAGE,
    })
    senha: string;
}