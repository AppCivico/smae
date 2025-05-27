import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateWorkflowFaseDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Fase' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @MinLength(1)
    fase: string;
}
