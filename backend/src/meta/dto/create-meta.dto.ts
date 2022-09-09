import { Type } from "class-transformer"
import { IsOptional, IsPositive, IsString, MaxLength, ValidateIf } from "class-validator"

export class CreateMetaDto {

    /**
    * Código
    */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(30, { message: '$property| descrição: codigo 30 caracteres' })
    codigo: string

    /**
    * título
    */
    @IsString({ message: '$property| título: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| título: codigo 250 caracteres' })
    titulo: string


    /**
    * contexto
    */
    @IsOptional()
    @IsString({ message: '$property| título: Precisa ser alfanumérico' })
    @MaxLength(1000, { message: '$property| título: codigo 1000 caracteres' })
    contexto?: string

    /**
    * complemento
    */
    @IsOptional()
    @IsString({ message: '$property| título: Precisa ser alfanumérico' })
    @MaxLength(1000, { message: '$property| título: codigo 1000 caracteres' })
    complemento?: string

    /**
    * macro_tema_id
    */
    @IsOptional()
    @IsPositive({ message: '$property| precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    macro_tema_id?: number

    /**
    * tema_id
    */
    @IsOptional()
    @IsPositive({ message: '$property| precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    tema_id?: number

    /**
    * sub_tema_id
    */
    @IsOptional()
    @IsPositive({ message: '$property| precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    sub_tema_id?: number


    /**
   * pdm_id
   */
    @IsPositive({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    pdm_id: number

}
