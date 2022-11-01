import { IsBoolean, IsOptional } from "class-validator";

export class FilterGrupoPaineisDto {
    /**
    * ativo
    */
    @IsBoolean()
    @IsOptional()
    ativo?: boolean
}