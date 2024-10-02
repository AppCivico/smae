import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowFaseDto } from './create-workflow-fase.dto';

export class UpdateWorkflowFaseDto extends PartialType(CreateWorkflowFaseDto) {}
