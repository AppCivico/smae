import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkflowEtapaDto {
    @IsString()
    @MaxLength(250)
    @MinLength(1)
    // Modificando de "etapa_fluxo" para "descrição" para facilitar implementação do front-end.
    descricao: string;
}
