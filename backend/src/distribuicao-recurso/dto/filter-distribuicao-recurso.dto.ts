import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class FilterDistribuicaoRecursoDto {
    @IsNumber()
    @Type(() => Number)
    transferencia_id?: number;
}
