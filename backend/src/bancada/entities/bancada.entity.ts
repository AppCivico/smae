import { PartidoDto } from 'src/partido/entities/partido.entity';

export class BancadaOneDto {
    id: number;
    nome: string;
    sigla: string;
    descricao: string | null;

    partidos: PartidoDto[];
}

export class BancadaDto {
    id: number;
    nome: string;
    sigla: string;
}

export class ListBancadaDto {
    linhas: BancadaDto[];
}
