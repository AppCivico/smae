import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkflowEtapaDto {
    @IsString()
    @MaxLength(250)
    @MinLength(1)
    descricao: string;
}
