import { ParlamentarCargo } from '@prisma/client';

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
    dia_aniversario: number | null;
    mes_aniversario: number | null;
    email: string | null;
    cargo: ParlamentarCargo | null;
    ano_eleicao: number;
}

export class ParlamentaresRelatorioDto {
    linhas: RelParlamentaresDto[];
}
