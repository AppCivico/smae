import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class EnviarEmailParlamentaresDto {
    @IsString()
    @IsNotEmpty({ message: 'Assunto é obrigatório' })
    @MaxLength(500)
    assunto: string;

    @IsString()
    @IsNotEmpty({ message: 'Corpo do e-mail é obrigatório' })
    @MaxLength(MAX_LENGTH_MEDIO)
    corpo: string;
}
