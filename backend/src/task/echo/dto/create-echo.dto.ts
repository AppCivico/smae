import { IsString, MaxLength } from 'class-validator';

export class CreateEchoDto {
    @IsString()
    @MaxLength(100)
    echo: string;
}
