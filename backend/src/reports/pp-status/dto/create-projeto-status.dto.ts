import { Transform } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class CreateRelProjetoStatusDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    portfolio_id: number;

    //TODO filtro por data (range?)
}
