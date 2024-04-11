import { IsInt } from 'class-validator';

export class FilterWorkflowAndamentoDto {
    @IsInt()
    transferencia_id: number;
}
