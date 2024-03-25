import { IsOptional, IsNumber } from 'class-validator';

export class FilterDistribuicaoRecursoDto {
    @IsOptional()
    @IsNumber()
    transferencia_id?: number;
}
