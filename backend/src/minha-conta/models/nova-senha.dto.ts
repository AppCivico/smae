import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class NovaSenhaDto {
    @ApiProperty({ description: 'Senha atual' })
    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    senha_corrente: string

    @ApiProperty({ description: 'Senha nova' })
    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    @MinLength(8, { message: '$property| Senha: Mínimo de 8 caracteres' })
    @MaxLength(1000, { message: '$property| Senha: Máximo de 1000 caracteres' })
    @Matches(/((?=.*\d)|(?=.*\W+)|(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]))(?![.\n])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-z]).*$/, {
        message: '$property| Senha: Precisa ter pelo menos 1 número e um caractere em caixa alta e um dos seguintes caracteres especiais: !@#$%^&*()_+-=\\[]{};\':"\\|,.<>/?',
    })
    senha_nova: string
}