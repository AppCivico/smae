
export class CreateBlocoNotaDto {
    transferencia_id?: number;
    projeto_id?: number;
}

export class ListBlocoNotaDto {
    linhas: BlocoNotaItem[];
}

export class BlocoNotaItem {
    bloco: string;
}
