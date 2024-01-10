import { IdSiglaDescricao } from '../../../common/dto/IdSigla.dto';

export class PortfolioDto {
    id: number;
    titulo: string;
    nivel_maximo_tarefa: number;
    orgaos: IdSiglaDescricao[];
}

export class PortfolioOneDto {
    id: number;
    titulo: string;
    nivel_maximo_tarefa: number;
    nivel_regionalizacao: number;
    orgaos: number[];
    descricao: string;
    data_criacao: Date | null;
    orcamento_execucao_disponivel_meses: number[];
    grupo_portfolio: number[];
}

export class ListPortfolioDto {
    linhas: PortfolioDto[];
}
