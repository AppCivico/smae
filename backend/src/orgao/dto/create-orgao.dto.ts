import { IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class CreateOrgaoDto {
    /**
    * Sigla do Órgão
    */
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| sigla: Mínimo de 1 caractere' })
    @MaxLength(20, { message: '$property| sigla: Máximo 20 caracteres' })
    sigla: string

    /**
    * Órgão
    */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| descrição: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string

    /**
    * Tipo do Órgão
    */
    @IsPositive({ message: '$property| precisa ser um número' })
    tipo_orgao_id: number


}
