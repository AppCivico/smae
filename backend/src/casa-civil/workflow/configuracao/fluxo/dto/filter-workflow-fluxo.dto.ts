import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class FilterWorkflowFluxoDto {
    @IsOptional()
    @IsInt({ message: '$property| workflow_id' })
    @Type(() => Number)
    workflow_id?: number;
}
