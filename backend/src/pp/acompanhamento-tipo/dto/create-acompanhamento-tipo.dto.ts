import { IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateTipoAcompanhamentoDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;
}
