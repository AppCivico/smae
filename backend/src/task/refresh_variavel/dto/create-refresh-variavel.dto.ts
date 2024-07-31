import { IsInt } from 'class-validator';

export class CreateRefreshVariavelDto {
    @IsInt()
    variavel_id: number;
}
