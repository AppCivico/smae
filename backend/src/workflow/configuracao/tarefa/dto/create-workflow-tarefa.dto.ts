import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkflowTarefaDto {
    @IsString()
    @MaxLength(250)
    @MinLength(1)
    // Modificando de "tarefa_fluxo" para "descrição" para facilitar implementação do front-end.
    descricao: string;
}
