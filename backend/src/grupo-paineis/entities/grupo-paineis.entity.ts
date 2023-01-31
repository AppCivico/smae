export class GrupoPaineis {
    id: number;
    nome: string;
    ativo: boolean;
    painel_count: number | 0;
    pessoa_count: number | 0;
    paineis: Paineis[] | null;
    pessoas: Pessoas[] | null;
}

export class Paineis {
    id: number;
    nome: string;
    ativo: boolean;
}

export class Pessoas {
    id: number;
    nome_exibicao: string;
}
