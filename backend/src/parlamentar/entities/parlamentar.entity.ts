import { DadosEleicaoNivel, MunicipioTipo, ParlamentarCargo, ParlamentarEquipeTipo, ParlamentarSuplente, ParlamentarUF } from "@prisma/client";
import { IsEnum } from "class-validator";
import { IdNomeDto } from "src/common/dto/IdNome.dto";
import { EleicaoDto } from "src/eleicao/entity/eleicao.entity";
import { PartidoDto } from "src/partido/entities/partido.entity";

export class ParlamentarDetailDto {
    id: number
    nome: string;
    nome_popular: string | null;
    nascimento: string | undefined;
    email: string | null;
    em_atividade: boolean;
    foto: string | null;

    // Dados do mandato corrente
    biografia: string | null;
    atuacao: string | null;

    equipe: EquipeDto[] | null;
    mandatos: MandatoDto[] | null;
}

export class ParlamentarDto {
    id: number;
    nome: string;
    nome_popular: string | null;
    em_atividade: boolean;

    partido: PartidoDto | null;
    cargo: ParlamentarCargo | null;
}

export class ListParlamentarDto {
    linhas: ParlamentarDto[]
}

export class EquipeDto {
    id: number;
    email: string;
    nome: string;
    telefone: string;
    @IsEnum(ParlamentarEquipeTipo)
    tipo: ParlamentarEquipeTipo;
}

export class MandatoDto {
    id: number;
    partido_candidatura: PartidoDto;
    partido_atual: PartidoDto;

    cargo: ParlamentarCargo;
    uf: ParlamentarUF;
    suplencia: ParlamentarSuplente |null;
    gabinete: string | null;
    eleito: boolean;
    endereco: string | null;
    votos_estado: bigint | null;
    votos_capital: bigint | null;
    votos_interior: bigint | null;
    biografia: string | null;
    atuacao: string | null;

    eleicao: EleicaoDto;

    suplentes: IdNomeDto[];
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