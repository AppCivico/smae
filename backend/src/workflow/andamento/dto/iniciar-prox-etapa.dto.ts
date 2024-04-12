import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class WorkflowIniciarProxEtapaDto {
    @IsInt()
    @Type(() => Number)
    transferencia_id: number;
}
