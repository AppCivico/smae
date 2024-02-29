import { DadosEleicaoNivel, MunicipioTipo, ParlamentarCargo, ParlamentarSuplente, ParlamentarUF } from "@prisma/client";
import { BancadaDto } from "src/bancada/entities/bancada.entity";
import { IdNomeDto } from "src/common/dto/IdNome.dto";
import { PartidoDto } from "src/partido/entities/partido.entity";

export class ParlamentarDetailDto {
    id: number
    nome: string;
    nome_popular: string | null;
    biografia: string | null;
    nascimento: Date | null;
    email: string | null;
    atuacao: string | null;
    em_atividade: boolean;

    assessores: AssessorDto[] | null;
    mandatos: MandatoDto[] | null;
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

export class MandatoDto {
    id: number;
    partido_candidatura: PartidoDto;
    partido_atual: PartidoDto;

    cargo: ParlamentarCargo;
    uf: ParlamentarUF;
    suplencia: ParlamentarSuplente |null;
    gabinete: string;
    eleito: boolean;
    endereco: string | null;
    votos_estado: bigint | null;
    votos_capital: bigint | null;
    votos_interior: bigint | null;

    suplentes: IdNomeDto[];
    bancadas: BancadaDto[];
    representatividade: RepresentatividadeDto[];
}

export class RepresentatividadeDto {
    id: number;
    nivel: DadosEleicaoNivel;
    municipio_tipo: MunicipioTipo | null;
    numero_votos: number;
    pct_participacao: number | null;
    
    regiao: {
        id: number;
        nivel: number;
        codigo: string | null;

        comparecimento: {
            id: number,
            valor: number
        }
    }
}

export class SuplentesDto {
    id: number;
    suplencia: ParlamentarSuplente;

    parlamentar: {
        id: number;
        nome: string;
    }
}