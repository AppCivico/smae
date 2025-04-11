import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateRefreshMvDto {
    @IsString()
    @MaxLength(100)
    @Matches(/^[A-Z_0-9]+$/i)
    mv_name: string;
}
