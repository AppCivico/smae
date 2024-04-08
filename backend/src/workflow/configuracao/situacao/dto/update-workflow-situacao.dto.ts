import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowSituacaoDto } from './create-workflow-situacao.dto';

export class UpdateWorkflowSituacaoDto extends PartialType(CreateWorkflowSituacaoDto) {}
