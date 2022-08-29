import { Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
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
    descricao?: string


    /**
    * Prefeito
    */
    @IsString({ message: '$property| prefeito: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| prefeito: Máximo 250 caracteres' })
    prefeito: string

    /**
    * Equipe
    */
    @IsString({ message: '$property| equipe técnica: Precisa ser alfanumérico' })
    @MaxLength(2500, { message: '$property| equipe técnica: Máximo 2500 caracteres' })
    equipe_tecnica: string

    /**
    * Data de inicio
    * @example YYYY-MM-DD
    */
    @IsOnlyDate()
    @Type(() => Date)
    data_inicio: Date

    /**
    * Data de fim
    * @example YYYY-MM-DD
    */
    @IsOnlyDate()
    @Type(() => Date)
    data_fim: Date

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
}
