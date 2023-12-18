import { IsString } from 'class-validator';

export class UpdateTextoConfigDto {
    @IsString()
    bemvindo_email: string;

    @IsString()
    tos: string;
}
