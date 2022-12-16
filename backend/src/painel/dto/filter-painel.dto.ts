import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class FilterPainelDto {
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    ativo?: boolean
}