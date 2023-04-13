import { Transform } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class CreateRelProjetoStatusDto {
    /**
     * ID do projeto para criar o relatório
     * @example ""
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @IsOptional()
    portfolio_id?: number;

    //TODO filtro por data (range?)
}
