import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkflowTarefaDto {
    @IsString()
    @MaxLength(255, {message: 'O campo "Descrição" deve ter no máximo 255 caracteres'})
    @MinLength(1)
    // Modificando de "tarefa_fluxo" para "descrição" para facilitar implementação do front-end.
    descricao: string;
}
