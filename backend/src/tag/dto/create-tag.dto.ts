import { Type } from "class-transformer"
import { IsOptional, IsPositive, IsString, MaxLength, ValidateIf } from "class-validator"

export class CreateTagDto {
    /**
    * Descrição
    */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string

    /**
    * Upload do Ícone
    */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: '$property| upload_token de um arquivo de ícone' })
    upload_icone?: string | null

    /**
    * ID do PDM
    */
    @IsPositive({ message: '$property| Necessário ID do PDM' })
    @Type(() => Number)
    pdm_id: number

    /**
    * ID do ODS (opcional, enviar null para remover/não existir)
    */
    @IsOptional()
    @IsPositive({ message: '$property| ODS no PATCH pode não existir (fica o antigo), se enviado precisa ser nulo ou numérico' })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    ods_id?: number
}
