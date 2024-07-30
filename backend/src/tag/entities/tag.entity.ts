import { IdTituloDto } from "../../common/dto/IdTitulo.dto";

export class TagDto {
    descricao: string;
    icone: string | null;
    pdm_id: number | null;
    ods_id: number | null;
    ods: IdTituloDto| null;
}
