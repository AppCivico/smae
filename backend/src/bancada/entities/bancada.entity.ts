export class BancadaOneDto {
    id: number;
    nome: string;
    sigla: string;
    descricao: string | null;
}

export class BancadaDto {
    id: number;
    nome: string;
    sigla: string;
}

export class ListBancadaDto {
    linhas: BancadaDto[]
}