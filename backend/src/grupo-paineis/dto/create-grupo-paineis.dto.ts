import { IsBoolean, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateGrupoPaineisDto {
    /**
     * nome
     */
    @IsString({ message: '$property| Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    /**
     * ativo
     */
    @IsBoolean()
    ativo: boolean;
}
