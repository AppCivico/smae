
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength } from "class-validator";
import { OrcamentoPlanejado } from "../entities/orcamento-planejado.entity";

export class CreateOrcamentoPlanejadoDto {

    /**
    * ano_referencia
    * @example "42"
    */
    @IsOptional()
    @IsPositive({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id: number;

    /**
    * ano_referencia
    * @example "2022"
    */
    @IsOptional()
    @IsPositive({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;

    /**
    * Valor Planejado
    * @example "42343.34"
    */
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Planejado com até duas casas decimais' })
    @IsPositive({ message: '$property| Investimento precisa ser positivo' })
    @Type(() => Number)
    valor_planejado: number;

    /**
    * parte_dotacao: esperado exatamente
    * @example "00.00.00.000.0000.0.000.00000000.00"
    */
    @IsString()
    @MaxLength(40)
    @Matches(/^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}$/, { message: 'Dotação não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00' })
    dotacao: string;
}

export class FilterOrcamentoPlanejadoDto {
    /**
   * Filtrar por meta_id
   * @example "42"
    */
    @IsOptional()
    @IsPositive({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id?: number;

    /**
   * Filtrar por ano_referencia?
   * @example "2022"
    */
    @IsOptional()
    @IsPositive({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia?: number;

}

export class ListOrcamentoPlanejadoDto {
    linhas: OrcamentoPlanejado[]
}
