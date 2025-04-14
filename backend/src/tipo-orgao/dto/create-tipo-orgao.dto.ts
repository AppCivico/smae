import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateTipoOrgaoDto {
    /**
     * Tipo do Órgão
     * @example "Empresa Pública"
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo de 1 caractere' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;
}
