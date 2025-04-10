import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkflowFaseDto {
    @IsString()
    @MaxLength(255, {message: 'O campo "Fase" deve ter no máximo 255 caracteres'})
    @MinLength(1)
    fase: string;
}
