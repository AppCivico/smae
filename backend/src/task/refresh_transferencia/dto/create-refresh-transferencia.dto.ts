import { IsInt } from 'class-validator';

export class CreateRefreshTransferenciaDto {
    @IsInt()
    transferencia_id: number;
}
