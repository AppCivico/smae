import { IsNumber, IsOptional } from "class-validator";

export class CreateRelParlamentaresDto {
    @IsOptional()
    @IsNumber()
    partido_id?: number;

    // @IsOptional()

}