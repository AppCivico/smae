import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAeCronogramaTpJobDto {
    @IsOptional()
    @IsInt()
    tarefa_cronograma_id?: number;

    @IsOptional()
    @IsInt()
    tarefa_id?: number;

    @IsArray()
    @IsString({ each: true })
    cc: string[];

    @IsOptional()
    @IsInt()
    aviso_email_id?: number;
}
