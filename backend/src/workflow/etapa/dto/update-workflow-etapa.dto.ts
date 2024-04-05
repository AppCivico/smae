import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowEtapaDto } from './create-workflow-etapa.dto';

export class UpdateWorkflowEtapaDto extends PartialType(CreateWorkflowEtapaDto) {}
