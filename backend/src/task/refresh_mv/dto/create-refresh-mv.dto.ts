import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateRefreshMvDto {
    @IsString()
    @MaxLength(255, { message: 'O campo "mv_name" deve ter no máximo 255 caracteres' })
    @Matches(/^[A-Z_0-9]+$/i)
    mv_name: string;
}
