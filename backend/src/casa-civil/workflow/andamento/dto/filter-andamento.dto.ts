import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class FilterWorkflowAndamentoDto {
    @IsInt()
    @Type(() => Number)
    transferencia_id: number;
}
