import { IsOptional } from "class-validator";
import { IsTrueFalseString } from "src/common/decorators/IsTrueFalseStr";

export class FilterPdmDto {
    /**
   * Filtrar Pdm com Ativo?
   * @example "true"
    */
    @IsOptional()
    @IsTrueFalseString()
    ativo?: string;


}
