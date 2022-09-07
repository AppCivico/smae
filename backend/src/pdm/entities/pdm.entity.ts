import { Type } from "class-transformer";
import { IsBoolean, IsBooleanString, isBooleanString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class Pdm {

    /**
    * Nome
    */
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| Nome: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| Nome: Máximo 250 caracteres' })
    nome: string


    /**
    * Descrição
    */
    @IsOptional()
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Descrição: Máximo 250 caracteres' })
    descricao?: string | null


    /**
    * Prefeito
    */
    @IsString({ message: '$property| prefeito: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| prefeito: Máximo 250 caracteres' })
    prefeito: string

    /**
    * Equipe Técnica
    */
    @IsOptional()
    @IsString({ message: '$property| equipe técnica: Precisa ser alfanumérico' })
    @MaxLength(2500, { message: '$property| equipe técnica: Máximo 2500 caracteres' })
    equipe_tecnica: string | null

    /**
    * Data de inicio
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    data_inicio: Date | null

    /**
    * Data de fim
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    data_fim: Date | null

    /**
    * Data de publicação
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    data_publicacao?: Date | null

    /**
    * Data de fim
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    periodo_do_ciclo_participativo_inicio?: Date | null

    /**
    * Data de fim
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    periodo_do_ciclo_participativo_fim?: Date | null


    /**
    * Rótulo Macro Tema
    */
    @IsOptional()
    @MaxLength(30, { message: '$property| Rótulo Macro Tema: Máximo 30 caracteres' })
    rotulo_macro_tema?: string | undefined


    /**
    * Rótulo Tema
    */
    @IsOptional()
    @MaxLength(30, { message: '$property| Rótulo Tema: Máximo 30 caracteres' })
    rotulo_tema?: string | undefined

    /**
    * Rótulo Sub Tema
    */
    @IsOptional()
    @MaxLength(30, { message: '$property| Rótulo Sub Tema: Máximo 30 caracteres' })
    rotulo_sub_tema?: string | undefined

    /**
    * Rótulo Contexto Meta
    */
    @IsOptional()
    @IsString({ message: '$property| Rótulo Contexto Meta: Precisa ser alfanumérico' })
    @MaxLength(30, { message: '$property| Rótulo Contexto Meta: Máximo 30 caracteres' })
    rotulo_contexto_meta?: string | undefined

    /**
    * Rótulo Complemento Meta
    */
    @IsOptional()
    @IsString({ message: '$property| Rótulo Complemento Meta: Precisa ser alfanumérico' })
    @MaxLength(30, { message: '$property| Rótulo Complemento Meta: Máximo 30 caracteres' })
    rotulo_complementacao_meta?: string | undefined


    /**
    * Rótulo Macro Tema
    */
    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    possui_macro_tema?: boolean


    /**
    * Rótulo Tema
    */
    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    possui_tema?: boolean


    /**
    * Rótulo Sub Tema
    */
    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    possui_sub_tema?: boolean

    /**
    * Rótulo Contexto Meta
    */
    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    possui_contexto_meta?: boolean

    /**
    * Rótulo Complemento Meta
    */
    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    possui_complementacao_meta?: boolean

}
