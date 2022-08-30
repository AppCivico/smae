import { IsNumber, IsPositive, IsString, MaxLength, MinLength } from "class-validator";
export class CreateEixoDto {
    /**
    * Descrição
    */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string

    /**
   * pdm_id
   */
    @IsPositive({ message: '$property' })
    pdm_id: number
}
