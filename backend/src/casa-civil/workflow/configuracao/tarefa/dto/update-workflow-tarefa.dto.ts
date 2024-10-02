import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowTarefaDto } from './create-workflow-tarefa.dto';

export class UpdateWorkflowTarefaDto extends PartialType(CreateWorkflowTarefaDto) {}
