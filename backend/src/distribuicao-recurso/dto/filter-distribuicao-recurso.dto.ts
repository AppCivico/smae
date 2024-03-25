import { IsOptional, IsNumber } from 'class-validator';

export class FilterDistribuicaoRecursoDto {
    @IsOptional()
    @IsNumber()
    id?: number;
}
