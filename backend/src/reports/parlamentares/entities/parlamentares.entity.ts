import { ParlamentarCargo } from '@prisma/client';

export class RelParlamentaresDto {
    id: number;
    nome_civil: string;
    nome_parlamentar: string | null;
    partido_sigla: string;
    uf: string;
    titular_suplente: string | null; // tava sem poder ser null, eu acho que pode ser null
    endereco: string | null;
    gabinete: string | null;
    telefone: string | null;
    dia_aniversario: number | null;
    mes_aniversario: number | null;
    email: string | null;
    cargo: ParlamentarCargo | null;
    ano_eleicao: number | null; // aqui tbm
    zona_atuacao: string | null;
}

export class ParlamentaresRelatorioDto {
    linhas: RelParlamentaresDto[];
}
