import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateNotaJobDto {
    @IsInt()
    nota_id: number;

    @IsArray()
    @IsString({ each: true })
    cc: string[];

    @IsOptional()
    @IsInt()
    aviso_email_id?: number;
}
