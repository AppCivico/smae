import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { IsTrueFalseString } from "src/common/decorators/IsTrueFalseStr";

export class FilterPessoaDto {
    /**
   * Filtrar tipo de pessoa?
   * @example "true"
    */
    @IsOptional()
    @IsTrueFalseString()
    coorderandor_responsavel_cp?: string;

    /**
   * Filtrar por orgão
   * @example 1
    */
    @IsOptional()
    @IsPositive({ message: '$property| orgao_id' })
    @Type(() => Number)
    orgao_id?: number;

}