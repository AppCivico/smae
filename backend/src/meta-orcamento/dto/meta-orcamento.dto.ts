import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, ValidateIf } from "class-validator";
import { MetaOrcamento } from "../entities/meta-orcamento.entity";

export class CreateMetaOrcamentoDto {

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
    * Custeio previsto
    * @example "2341242423.34"
    */
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Custeio até duas casas decimais' })
    @IsPositive({ message: '$property| Custeio precisa ser positivo' })
    @Type(() => Number)
    custeio_previsto: number;

    /**
    * Investimento previsto
    * @example "42343.34"
    */
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Investimento até duas casas decimais' })
    @IsPositive({ message: '$property| Investimento precisa ser positivo' })
    @Type(() => Number)
    investimento_previsto: number;

    /**
    * parte_dotacao
    * @example "00.00.00.000.0000.0.000.00000000.00-0"
    */
    @IsString()
    @MaxLength(40)
    // faz o match parcial, mas alguns campos precisam ser completos
    @Matches(/^(\d{2}(\.\d{2}(\.\d{2}(\.\d{3}(\.\d{4}((?:\.\d\.\d{3})(\.\d{8}(\.\d{2}(\-\d)?)?)?)?)?)?)?)?)?$/, {message: 'Dotação parcial não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00-0'})
    @ValidateIf((object, value) => value !== '')
    parte_dotacao: string;

}

export class FilterMetaOrcamentoDto {
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

    /**
   * trazer apenas os registros mais recentes?
   * @example "true"
    */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    apenas_ultima_revisao?: boolean;
}

export class ListMetaOrcamentoDto {
    linhas: MetaOrcamento[]
}
