import { IdDesc } from "src/atividade/entities/atividade.entity";

export class ParlamentarDetailDto {
    id: number
    nome: string;
    nome_popular: string | null;
    nascimento: string | null;
    telefone: string | null;
    email: string | null;
    gabinete: string | null;
    endereco: string | null;
    atuacao: string | null;
    em_atividade: boolean;

    regiao: IdDesc;
}

export class ParlamentarDto {
    id: number;
    nome: string;
    nome_popular: string | null;
    em_atividade: boolean;
}

export class ListParlamentarDto {
    linhas: ParlamentarDto[]
}