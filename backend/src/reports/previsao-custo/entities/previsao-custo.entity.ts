import { IdCodNomeDto } from 'src/common/dto/IdCodNome.dto';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';

export class RelPrevisaoCustoDto {
    meta: IdCodTituloDto | null;
    iniciativa: IdCodTituloDto | null;
    atividade: IdCodTituloDto | null;
    projeto: IdCodNomeDto | null;

    custo_previsto: string;
    projeto_atividade: string;
    parte_dotacao: string;
    ano_referencia: number;
    id: number;
    /**
     * Já vinha no `select` da extração (e no JSON devolvido pela API); só não estava declarado
     * aqui. Agora é usado pela coluna `id_versao_anterior` do CSV, que antes saía sempre vazia.
     */
    versao_anterior_id: number | null;
    criado_em: Date;
    atualizado_em: Date;
}

export class ListPrevisaoCustoDto {
    linhas: RelPrevisaoCustoDto[];
}
