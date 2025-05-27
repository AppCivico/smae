import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';
export class CreateSubTemaDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;

    /**
     * pdm_id
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    pdm_id: number;
}
