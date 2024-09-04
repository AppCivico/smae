export class TipoIntervencao {
    id: number;
    nome: string;
    conceito: string | null;
}

export class ListTipoIntervencaoDto {
    linhas: TipoIntervencao[];
}
