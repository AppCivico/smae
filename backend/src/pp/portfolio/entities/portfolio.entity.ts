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
    orgaos: number[];
}


export class ListPortfolioDto {
    linhas: PortfolioDto[];
}
