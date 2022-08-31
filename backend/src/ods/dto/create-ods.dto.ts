import { IsOptional, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class CreateOdsDto {
    /**
   * Número
   * @example 1
    */
    @IsPositive()
    numero: number;

    /**
       * Título
       * @example "Erradicar Pobreza"
    */
    @IsString({ message: '$property| Título: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Título: Mínimo de 4 caracteres' })
    @MaxLength(30, { message: '$property| Título: Máximo 30 caracteres' })
    titulo: string;


    /**
       * Descrição
    */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Descrição: Mínimo de 4 caracteres' })
    @MaxLength(250, { message: '$property| Descrição: Máximo 250 caracteres' })
    descricao: string;

}
