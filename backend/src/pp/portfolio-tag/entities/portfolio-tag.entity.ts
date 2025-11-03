import { IdTituloDto } from 'src/common/dto/IdTitulo.dto';

export class PortfolioTagDto {
    id: number;
    descricao: string;
    portfolio: IdTituloDto;
}
