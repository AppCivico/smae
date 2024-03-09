export class RelParlamentaresDto {
    id: number;
    nome_civil: string;
    nome_parlamentar: string | null;
    partido_sigla: string;
    uf: string;
    titular_suplente: string;
    endereco: string | null;
    gabinete: string | null;
    telefone: string | null;
    nascimento: string | null;
    email: string | null;
}

export class ParlamentaresRelatorioDto {
    linhas: RelParlamentaresDto[];
}
