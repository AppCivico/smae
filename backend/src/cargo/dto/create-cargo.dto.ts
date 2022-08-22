import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateCargoDto {
    /**
    * Cargo
    */
    @IsString({ message: '$property| Nome Social: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descricao: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| descricao: Máximo 250 caracteres' })
    descricao: string
}
