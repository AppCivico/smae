import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreatePdmDocumentDto {
    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token de um arquivo de ícone' })
    upload_token: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string | null;

    @IsOptional()
    @IsString({ message: '$property| Caminho do diretório de arquivos' })
    diretorio_caminho: string;
}

export class UpdatePdmDocumentDto extends CreatePdmDocumentDto {}
