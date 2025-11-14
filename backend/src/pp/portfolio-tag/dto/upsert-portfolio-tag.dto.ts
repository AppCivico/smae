import { IsNumber, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class UpsertPortfolioTagDto {
    @IsNumber()
    portfolio_id: number;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT)
    descricao: string;
}
