import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateTagDto {
    /**
     * Descrição
     */
    @IsString({ message: 'descrição: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;

    /**
     * Upload do Ícone
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: 'upload_token de um arquivo de ícone' })
    upload_icone?: string | null;

    /**
     * ID do PDM
     */
    @IsInt({ message: 'Necessário ID do PDM' })
    @IsOptional()
    @Type(() => Number)
    pdm_id: number;

    /**
     * ID do ODS (opcional, enviar null para remover/não existir)
     */
    @IsInt({
        message: 'ODS no PATCH pode não existir (fica o antigo), se enviado precisa ser nulo ou numérico',
    })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    ods_id: number;
}
