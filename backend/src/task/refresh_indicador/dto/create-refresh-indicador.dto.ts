import { IsInt } from 'class-validator';

export class CreateRefreshIndicadorDto {
    @IsInt()
    indicador_id: number;
}
