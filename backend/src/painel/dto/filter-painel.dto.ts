import { IsBoolean, IsOptional } from "class-validator";

export class FilterPainelDto {
    @IsBoolean()
    @IsOptional()
    ativo?: boolean
}