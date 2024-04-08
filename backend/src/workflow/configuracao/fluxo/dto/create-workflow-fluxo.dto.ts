import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateWorkflowFluxoDto {
    @IsInt({ message: '$property| workflow_id precisa ser um número ou null' })
    @Type(() => Number)
    workflow_id: number;

    @IsInt({ message: '$property| workflow_etapa_de_id precisa ser um número ou null' })
    @Type(() => Number)
    workflow_etapa_de_id: number;

    @IsInt({ message: '$property| workflow_etapa_para_id precisa ser um número ou null' })
    @Type(() => Number)
    workflow_etapa_para_id: number;

    @IsNumber()
    @IsInt({ message: '$property| ordem precisa ser um número ou null' })
    @IsOptional()
    ordem: number;
}
