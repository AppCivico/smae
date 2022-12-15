import { IdCodTituloDto } from "../../common/dto/IdCodTituloDto";

export class MetaOrcamento {
    ano_referencia: number
    criado_em: Date
    criador: { nome_exibicao: string }
    meta: IdCodTituloDto
    atividade: IdCodTituloDto | null
    iniciativa: IdCodTituloDto | null

    custeio_previsto: string;
    investimento_previsto: string;
    parte_dotacao: string;

    // best effort pra buscar o projeto/atividade a partir da parte da dotacao
    projeto_atividade: string | null;

    id: number
}
