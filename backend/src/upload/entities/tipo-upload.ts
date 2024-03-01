export const TipoUpload = {
    SHAPEFILE: 'SHAPEFILE',
    ICONE_TAG: 'ICONE_TAG',
    DOCUMENTO: 'DOCUMENTO',
    LOGO_PDM: 'LOGO_PDM',
    IMPORTACAO_ORCAMENTO: 'IMPORTACAO_ORCAMENTO',
    FOTO_PARLAMENTAR: 'FOTO_PARLAMENTAR'
};
export type TipoUpload = (typeof TipoUpload)[keyof typeof TipoUpload];
