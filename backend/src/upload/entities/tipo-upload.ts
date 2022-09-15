export const TipoUpload = {
    SHAPEFILE: "SHAPEFILE",
    ICONE_TAG: "ICONE_TAG",
    DOCUMENTO: "DOCUMENTO",
    LOGO_PDM: "LOGO_PDM",
}
export type TipoUpload = (typeof TipoUpload)[keyof typeof TipoUpload];