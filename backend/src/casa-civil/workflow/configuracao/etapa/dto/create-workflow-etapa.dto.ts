import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateWorkflowEtapaDto {
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    @MinLength(1)
    // Modificando de "etapa_fluxo" para "descrição" para facilitar implementação do front-end.
    descricao: string;
}
