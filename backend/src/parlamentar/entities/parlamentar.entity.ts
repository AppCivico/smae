export class ParlamentarDetailDto {
    id: number
    nome: string;
    nome_popular: string | null;
    biografia: string | null;
    nascimento: Date | null;
    telefone: string | null;
    email: string | null;
    atuacao: string | null;
    em_atividade: boolean;

    assessores: AssessorDto[] | null
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

export class AssessorDto {
    id: number;
    email: string;
    nome: string;
    telefone: string;
}