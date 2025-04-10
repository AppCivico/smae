import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkflowEtapaDto {
    @IsString()
    @MaxLength(2048, {message: 'O campo "Descrição" deve ter no máximo 2048 caracteres'})
    @MinLength(1)
    // Modificando de "etapa_fluxo" para "descrição" para facilitar implementação do front-end.
    descricao: string;
}
