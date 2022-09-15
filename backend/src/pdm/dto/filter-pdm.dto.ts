import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { IsTrueFalseString } from "src/common/decorators/IsTrueFalseStr";

export class FilterPdmDto {
    /**
   * Filtrar Pdm com Ativo?
   * @example "true"
    */
    @IsOptional()
    @IsTrueFalseString()
    @Transform(({ value }: any) => value === 'true')
    ativo?: boolean;
}

export class FilterPdmDetailDto {
    /**
   * Filtrar Pdm com Ativo?
   * @example "true"
    */
    @IsTrueFalseString()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    incluir_auxiliares?: boolean;
}
