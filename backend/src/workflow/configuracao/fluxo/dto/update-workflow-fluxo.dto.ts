import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateWorkflowFluxoDto } from './create-workflow-fluxo.dto';

export class UpdateWorkflowFluxoDto extends PartialType(OmitType(CreateWorkflowFluxoDto, ['workflow_id'])) {}
