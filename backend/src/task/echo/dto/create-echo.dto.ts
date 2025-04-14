import { IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateEchoDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Echo' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    echo: string;
}
