import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength } from 'class-validator';
export class CreateSubTemaDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string;

    /**
     * pdm_id
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    pdm_id: number;
}
