import { IdNomeDto } from 'src/common/dto/IdNome.dto';

export class ProjetoAcompanhamentoRowDto {
    id: number;
    encaminhamento: string | null;
    responsavel: string | null;
    prazo_encaminhamento: Date | null;
    prazo_realizado: Date | null;
    ordem: number;
    numero_identificador: string;
}

export class ProjetoAcompanhamento {
    id: number;
    data_registro: Date;
    participantes: string;
    detalhamento: string | null;
    risco: RiscoIdCod[] | null;
    acompanhamento_tipo: IdNomeDto | null;
    ordem: number;

    pauta: string | null;
    acompanhamentos: ProjetoAcompanhamentoRowDto[];
}

export class ListProjetoAcompanhamentoDto {
    linhas: ProjetoAcompanhamento[];
}

export class DetailProjetoAcompanhamentoDto {
    id: number;
    data_registro: Date;
    participantes: string;
    detalhamento: string | null;
    observacao: string | null;
    detalhamento_status: string | null;
    pontos_atencao: string | null;
    cronograma_paralisado: boolean;
    risco: RiscoIdCod[] | null;
    pauta: string | null;
    acompanhamento_tipo: IdNomeDto | null;

    acompanhamentos: ProjetoAcompanhamentoRowDto[];
}

export class RiscoIdCod {
    id: number;
    codigo: number;
}
