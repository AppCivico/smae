import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowDto } from './create-workflow.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {
    @IsOptional()
    @IsBoolean()
    ativo?: boolean;
}
