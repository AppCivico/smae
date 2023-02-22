import { PartialType } from '@nestjs/swagger';
import { CreateTarefaDto } from './create-tarefa.dto';

// nem precisa tirar o projeto, pq ele já ta fixo na url
export class UpdateTarefaDto extends PartialType(CreateTarefaDto) { }
