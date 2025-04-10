import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength } from 'class-validator';

export class CreateObjetivoEstrategicoDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(2048, { message: 'O campo "Descricao" deve ter no máximo 2048 caracteres' })
    descricao: string;

    /**
     * pdm_id
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    pdm_id: number;
}
