import { IsNumber, IsOptional } from "class-validator";

export class FilterPlanoAcaoDto {
    @IsNumber()
    @IsOptional()
    risco_id?: number
}