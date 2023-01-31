import { IdCodTituloDto } from '../../common/dto/IdCodTitulo.dto';

export class OrcamentoRealizadoItem {
    valor_empenho: string;
    valor_liquidado: string;
    mes: number;
}

export class OrcamentoRealizado {
    meta: IdCodTituloDto;
    atividade: IdCodTituloDto | null;
    iniciativa: IdCodTituloDto | null;
    ano_referencia: number;
    dotacao: string;
    projeto_atividade: string;
    processo: string | null;
    nota_empenho: string | null;

    soma_valor_empenho: string;
    soma_valor_liquidado: string;

    smae_soma_valor_empenho: string | null;
    smae_soma_valor_liquidado: string | null;

    empenho_liquido: string | null;
    valor_liquidado: string | null;

    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
    id: number;

    itens: OrcamentoRealizadoItem[];
}
