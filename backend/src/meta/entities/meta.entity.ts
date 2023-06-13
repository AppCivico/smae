import { IdSiglaDescricao } from "src/common/dto/IdSigla.dto";

export class IdDesc {
    id: number;
    descricao: string;
}

export class IdNomeExibicao {
    id: number;
    nome_exibicao: string;
}

export class MetaOrgao {
    orgao: IdSiglaDescricao;
    responsavel: boolean;
    participantes: IdNomeExibicao[];
}

export class MetaTag {
    id: number;
    descricao: string;
}

export class MetaCronograma {
    id: number | null
    atraso_grau: string | null
}

export class Meta {
    id: number;
    status: string;
    pdm_id: number;
    codigo: string;
    titulo: string;
    contexto: string | null;
    complemento: string | null;
    macro_tema: IdDesc | null;
    tema: IdDesc | null;
    sub_tema: IdDesc | null;
    ativo: boolean;
    orgaos_participantes: MetaOrgao[];
    coordenadores_cp: IdNomeExibicao[];
    tags: MetaTag[];
    cronograma: MetaCronograma | null;
}
