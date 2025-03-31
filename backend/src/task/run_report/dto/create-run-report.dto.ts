import { IsInt } from 'class-validator';

export class CreateRunReportDto {
    @IsInt()
    relatorio_id: number;
}
