import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class FilterDistribuicaoRecursoDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    transferencia_id?: number;
}
