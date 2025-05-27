import { IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateProjetoEtapaDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;
}
