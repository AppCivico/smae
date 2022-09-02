import { IsString } from "class-validator";

export class CreatePdmDocumentDto {

    /**
    * Upload do Documento
    */
    @IsString({ message: '$property| upload_token de um arquivo de ícone' })
    upload_token: string

}
