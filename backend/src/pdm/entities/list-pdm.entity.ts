import { IsISO8601, IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";

export class ListPdm {

    /**
    * Nome
    */
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| nome: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string


    /**
    * Descrição
    */
    @IsOptional()
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao?: string | null


    /**
    * Data de inicio
    */
    @IsISO8601({ strict: true, message: '$property| data_inicio: Precisa ser uma data' })
    @Length(10, 10)
    data_inicio: Date

    /**
    * Data de fim
    */
    @IsISO8601({ strict: true, message: '$property| data_fim: Precisa ser uma data' })
    @Length(10, 10)
    data_fim: Date

    /**
    * Ativo
    */
    ativo: Boolean
}
