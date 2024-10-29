import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength } from 'class-validator';
export class CreateSubTemaDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(500, { message: '$property| descrição: Máximo 500 caracteres' })
    descricao: string;

    /**
     * pdm_id
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    pdm_id: number;
}
