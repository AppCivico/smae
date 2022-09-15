import { Transform, Type } from "class-transformer";
import { IsBoolean, IsOptional, IsPositive } from "class-validator";

export class FilterPessoaDto {
    /**
   * Filtrar pessoa com privilegio PDM.coorderandor_responsavel_cp?
   *  true filtra quem tem a PDM.coorderandor_responsavel_cp; false filtra quem não tem
   * @example "true"
    */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    coorderandor_responsavel_cp?: boolean;

    /**
   * Filtrar por órgão?
   * @example "1"
    */
    @IsOptional()
    @IsPositive({ message: '$property| orgao_id' })
    @Type(() => Number)
    orgao_id?: number;

}