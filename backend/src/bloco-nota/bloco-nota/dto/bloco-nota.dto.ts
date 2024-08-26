
export class CreateBlocoNotaDto {
    transferencia_id?: number;
    projeto_id?: number;
    transfere_gov?: string;
}

export class ListBlocoNotaDto {
    linhas: BlocoNotaItem[];
}

export class BlocoNotaItem {
    bloco: string;
}
