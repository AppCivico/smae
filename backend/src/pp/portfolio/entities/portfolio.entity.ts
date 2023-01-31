import { IdSiglaDescricao } from '../../../common/dto/IdSigla.dto';

export class PortfolioDto {
    id: number;
    titulo: string;
    orgaos: IdSiglaDescricao[];
}

export class ListPortfolioDto {
    linhas: PortfolioDto[];
}
