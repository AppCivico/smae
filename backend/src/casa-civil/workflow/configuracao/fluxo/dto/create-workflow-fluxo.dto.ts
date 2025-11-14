import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateWorkflowFluxoDto {
    @IsInt({ message: 'workflow_id precisa ser um número ou null' })
    @Type(() => Number)
    workflow_id: number;

    @IsInt({ message: 'workflow_etapa_de_id precisa ser um número ou null' })
    @Type(() => Number)
    workflow_etapa_de_id: number;

    @IsInt({ message: 'workflow_etapa_para_id precisa ser um número ou null' })
    @Type(() => Number)
    workflow_etapa_para_id: number;

    @IsNumber()
    @IsInt({ message: 'ordem precisa ser um número ou null' })
    @IsOptional()
    ordem: number;
}
