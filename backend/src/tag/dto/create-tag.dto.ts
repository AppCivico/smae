import { IsPositive, IsString, MaxLength, ValidateIf } from "class-validator"

export class CreateTagDto {
    /**
    * Descrição
    */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string

    /**
    * Descrição
    */
    @IsString({ message: '$property| ícone: path da url?' })
    icone?: string | null

    /**
    * ID do PDM
    */
    @IsPositive({ message: '$property' })
    pdm_id: number

    /**
    * ID do ODS (opcional, enviar null para remover/não existir)
    */
    @IsPositive({ message: '$property' })
    @ValidateIf((object, value) => value !== null)
    ods_id?: number | undefined | null
}
