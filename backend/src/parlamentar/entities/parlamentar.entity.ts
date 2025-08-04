import {
    DadosEleicaoNivel,
    MunicipioTipo,
    ParlamentarCargo,
    ParlamentarEquipeTipo,
    ParlamentarSuplente,
    ParlamentarUF,
} from 'src/generated/prisma/client';
import { IsEnum } from 'class-validator';
import { EleicaoDto } from 'src/eleicao/entity/eleicao.entity';
import { PartidoDto } from 'src/partido/entities/partido.entity';
import { IsDateYMD } from '../../auth/decorators/date.decorator';

export class ParlamentarDetailDto {
    id: number;
    nome: string;
    nome_popular: string | null;
    @IsDateYMD({ nullable: true })
    nascimento: string | null;
    telefone: string | null;
    email: string | null;
    em_atividade: boolean;
    foto: string | null;
    cpf: string;

    // Dados do mandato corrente
    ultimo_mandato: MandatoDto | null;

    equipe: EquipeDto[] | null;
    mandatos: MandatoDto[] | null;
}

export class ParlamentarDto {
    id: number;
    nome: string;
    nome_popular: string | null;
    em_atividade: boolean;

    cpf: string;
    partido: PartidoDto | null;
    cargo: ParlamentarCargo | null;
    eleicoes: number[] | null;
    tem_mandato: boolean | null;
    mandatos: number[] | null;
}

export class ListParlamentarDto {
    linhas: ParlamentarDto[];
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
    suplencia: ParlamentarSuplente | null;
    gabinete: string | null;
    eleito: boolean;
    endereco: string | null;
    votos_estado: bigint | null;
    votos_capital: bigint | null;
    votos_interior: bigint | null;
    biografia: string | null;
    atuacao: string | null;
    email: string | null;
    telefone: string | null;

    eleicao: EleicaoDto;

    suplentes: SuplentesDto[] | null;
    representatividade: RepresentatividadeDto[];
}

export class RepresentatividadeDto {
    id: number;
    nivel: DadosEleicaoNivel;
    municipio_tipo: MunicipioTipo | null;
    numero_votos: number;
    pct_participacao: number | null;
    ranking: number | null;
    regiao: {
        id: number;
        nivel: number;
        descricao: string;
        zona: string | null;
        comparecimento: {
            id: number;
            valor: number;
        };
    };
}

export class SuplentesDto {
    id: number;
    suplencia: ParlamentarSuplente | null;

    parlamentar: {
        id: number;
        nome: string;
        email: string | null;
        telefone: string | null;
    };
}

export class ParlamnetarIdNomes {
    id: number;
    nome: string;
    nome_popular: string | null;
}
