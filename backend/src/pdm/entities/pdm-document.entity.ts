import { TipoDocumentoDto } from '../../tipo-documento/entities/tipo-documento.entity';

export class PdmDocument {
    arquivo: {
        id: number;
        descricao: string | null;
        tamanho_bytes: number;
        TipoDocumento: TipoDocumentoDto | null;
        nome_original: string;
        download_token?: string;
    };
    id: number;
}
