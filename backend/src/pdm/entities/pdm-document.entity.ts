import { ArquivoBaseDto } from '../../upload/dto/create-upload.dto';

export class PdmItemDocumentDto {
    id: number;
    arquivo: ArquivoBaseDto;
    descricao: string | null;
}
