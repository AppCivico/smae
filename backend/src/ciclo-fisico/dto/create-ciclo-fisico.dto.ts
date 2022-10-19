import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreateCicloFisicoDto {
    /**
    * pdm_id
    */
    @IsPositive({ message: '$property| pdm precisa ser um número' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    pdm_id: number

    @IsNumber()
    @IsPositive()
    ano: number

    @IsNumber()
    @IsPositive()
    mes: number

    @IsOptional()
    @IsString()
    fase_atual?: string
}