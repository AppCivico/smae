export class DetalheRegiaoDto {
    id: number;
    descricao: string;
    shapefile: string | null;
    pdm_codigo_sufixo: string | null;
    codigo: string | null;
    nivel: number;
    parente_id: number | null;
}
