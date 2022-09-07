import { IsBoolean, isBoolean, IsISO8601, IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";

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
    data_inicio?: Date | null

    /**
    * Data de fim
    */
    @IsISO8601({ strict: true, message: '$property| data_fim: Precisa ser uma data' })
    @Length(10, 10)
    data_fim?: Date | null

    /**
    * Ativo
    */
    @IsBoolean()
    ativo: boolean


    prefeito: string
    data_publicacao: Date | null
    periodo_do_ciclo_participativo_inicio: Date | null
    periodo_do_ciclo_participativo_fim: Date | null


    rotulo_macro_tema: string
    rotulo_tema: string
    rotulo_sub_tema: string
    rotulo_contexto_meta: string
    rotulo_complementacao_meta: string
    possui_macro_tema: boolean
    possui_tema: boolean
    possui_sub_tema: boolean
    possui_contexto_meta: boolean
    possui_complementacao_meta: boolean


}
