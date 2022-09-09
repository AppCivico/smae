import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { IsTrueFalseString } from "src/common/decorators/IsTrueFalseStr";

export class FilterPessoaDto {
    /**
   * Filtrar pessoa com privilegio PDM.coorderandor_responsavel_cp?
   *  true filtra quem tem a PDM.coorderandor_responsavel_cp; false filtra quem não tem
   * @example "true"
    */
    @IsOptional()
    @IsTrueFalseString()
    coorderandor_responsavel_cp?: string;

    /**
   * Filtrar por órgão?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| orgao_id' })
    @Type(() => Number)
    orgao_id?: number;

}