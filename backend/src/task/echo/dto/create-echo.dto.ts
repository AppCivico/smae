import { IsString, MaxLength } from 'class-validator';

export class CreateEchoDto {
    @IsString()
    @MaxLength(255, { message: 'O campo "Echo" deve ter no máximo 255 caracteres' })
    echo: string;
}
