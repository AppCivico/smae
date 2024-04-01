import { IsInt } from 'class-validator';

export class CreateAvisoEmailJobDto {
    @IsInt()
    aviso_email_id: number;
}
