import { IdTituloDto } from 'src/common/dto/IdTitulo.dto';

export class PortfolioTagDto {
    id: number;
    descricao: string;
    portfolio_id: number;
    portifolio_titulo: string;
    pode_editar: boolean;
}
