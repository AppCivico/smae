import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateWorkflowfluxoFaseDto } from './create-workflow-fluxo-fase.dto';

export class UpdateWorkflowfluxoFaseDto extends PartialType(OmitType(CreateWorkflowfluxoFaseDto, ['fluxo_id'])) {}
