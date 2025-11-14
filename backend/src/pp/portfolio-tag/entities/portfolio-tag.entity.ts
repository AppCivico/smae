import { IdTituloDto } from 'src/common/dto/IdTitulo.dto';

export class PortfolioTagDto {
    id: number;
    descricao: string;
    portfolio_id: number;
    portfolio: IdTituloDto;
    pode_editar: boolean;
}
