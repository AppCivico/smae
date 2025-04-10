import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class CreateTagDto {
    /**
     * Descrição
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string;

    /**
     * Upload do Ícone
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: '$property| upload_token de um arquivo de ícone' })
    upload_icone?: string | null;

    /**
     * ID do PDM
     */
    @IsInt({ message: '$property| Necessário ID do PDM' })
    @IsOptional()
    @Type(() => Number)
    pdm_id: number;

    /**
     * ID do ODS (opcional, enviar null para remover/não existir)
     */
    @IsInt({
        message: '$property| ODS no PATCH pode não existir (fica o antigo), se enviado precisa ser nulo ou numérico',
    })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    ods_id: number;
}
