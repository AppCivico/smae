import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateOrgaoDto {
    /**
    * Sigla do Órgão
    */
    @IsOptional()
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(20, { message: '$property| sigla: Máximo 20 caracteres' })
    sigla?: string | null

    /**
    * Órgão
    */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string

    /**
    * Tipo do Órgão
    */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    tipo_orgao_id: number


}
