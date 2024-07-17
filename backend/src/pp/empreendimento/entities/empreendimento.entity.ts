export class EmpreendimentoDto {
    id: number;
    nome: string;
    identificador: string;
}

export class ListEmpreendimentoDto {
    linhas: EmpreendimentoDto[];
}
