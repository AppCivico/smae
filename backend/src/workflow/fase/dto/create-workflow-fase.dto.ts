import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkflowFaseDto {
    @IsString()
    @MaxLength(250)
    @MinLength(1)
    fase: string;
}
