import { Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class FilterDistribuicaoRecursoDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    transferencia_id?: number;
}
