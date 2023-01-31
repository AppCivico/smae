import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { MESSAGE, REGEXP } from '../../auth/models/EscreverNovaSenhaRequestBody.dto';

export class NovaSenhaDto {
    @ApiProperty({ description: 'Senha atual', example: 'Foo*bar1' })
    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    senha_corrente: string;

    @ApiProperty({ description: 'Senha nova', example: 'Foo*bar1' })
    @IsString({ message: '$property| Senha: Precisa ser alfanumérico' })
    @MinLength(8, { message: '$property| Senha: Mínimo de 8 caracteres' })
    @MaxLength(1000, { message: '$property| Senha: Máximo de 1000 caracteres' })
    @Matches(REGEXP, {
        message: MESSAGE,
    })
    senha_nova: string;
}
