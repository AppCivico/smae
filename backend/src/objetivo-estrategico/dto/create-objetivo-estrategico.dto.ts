import { Type } from "class-transformer"
import { IsPositive, IsString, MaxLength } from "class-validator"

export class CreateObjetivoEstrategicoDto {
    /**
    * Descrição
    */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string

    /**
   * pdm_id
   */
    @IsPositive({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    pdm_id: number

}
