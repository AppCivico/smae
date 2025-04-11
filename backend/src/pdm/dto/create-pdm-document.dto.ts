import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreatePdmDocumentDto {
    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token de um arquivo de ícone' })
    upload_token: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    descricao?: string | null;

    @IsOptional()
    @IsString({ message: '$property| Caminho do diretório de arquivos' })
    diretorio_caminho: string;
}

export class UpdatePdmDocumentDto extends CreatePdmDocumentDto {}
