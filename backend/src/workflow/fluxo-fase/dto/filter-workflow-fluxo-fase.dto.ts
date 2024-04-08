import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterWorkflowfluxoFaseDto {
    @IsOptional()
    @IsInt({ message: '$property| fluxo_id' })
    @Type(() => Number)
    fluxo_id?: number;
}
