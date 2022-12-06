import { OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, Min } from "class-validator";

export class CreateOrcamentoRealizadoDto {

    /**
    * meta_id, se for por meta
    * @example "42"
    */
    @IsOptional()
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id?: number;

    /**
    * iniciativa_id, se for por iniciativa
    * @example "42"
    */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id precisa ser positivo' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
    * atividade_id, se for por atividade
    * @example "42"
    */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id precisa ser positivo' })
    @Type(() => Number)
    atividade_id?: number;

    /**
    * ano_referencia
    * @example "2022"
    */
    @IsOptional()
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;

    /**
    * Valor Empenho para meta - no momento aceitando zero, mas é meio sem sentido IMHO, uma vez que se ta registrando é pq ta alocado!
    * @example "42343.34"
    */
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Valor Empenho com até duas casas decimais' })
    @Min(0, { message: '$property| Valor Empenhado precisa ser positivo ou zero' })
    @Type(() => Number)
    valor_empenho: number;


    /**
    * Valor Liquidado para meta - zero ou mais
    * @example "42343.34"
    */
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Valor Liquidado com até duas casas decimais' })
    @Min(0, { message: '$property| Valor Liquidado precisa ser positivo ou zero', })
    @Type(() => Number)
    valor_liquidado: number;

    /**
    * dotacao: esperado exatamente
    * @example "00.00.00.000.0000.0.000.00000000.00"
    */
    @IsString()
    @MaxLength(40)
    @Matches(/^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}$/, { message: 'Dotação não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00' })
    dotacao: string;

    /**
    * processo: esperado algo como "6016.2021/00532295", "6016.2021/0053229-5" ou "6016202100532295"
    * no banco será normalizado para o valor o número sozinho
    * @example "6016202100711203"
    */
    @IsString()
    @MaxLength(20)
    @Matches(/^\d{4}\.?\d{4}\/?\d{7}\-?\d$/, { message: 'Processo não está no formato esperado: 0000.0000/0000000-0' })
    processo?: string | null;

    /**
    * dotacao: esperado exatamente 5 dígitos
    * @example "00000"
    */
    @IsString()
    @MaxLength(6)
    @Matches(/^\d{5}$/, { message: 'Nota não está no formato esperado: 00000' })
    nota_empenho?: string | null;
}

export class UpdateOrcamentoRealizadoDto extends OmitType(CreateOrcamentoRealizadoDto, ['ano_referencia', 'dotacao', 'processo', 'nota_empenho']) { }

export class FilterOrcamentoRealizadoDto {
    /**
   * Filtrar por meta_id: eg: 205
   * @example ""
    */
    @IsOptional()
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id?: number;

    /**
  * Filtrar por dotacao: eg: 00.00.00.000.0000.0.000.00000000.00
  * @example ""
   */
    @IsOptional()
    @IsString()
    dotacao?: string;

    /**
    * Filtrar por processo
    * @example ""
    */
    @IsOptional()
    @IsString()
    @MaxLength(20)
    processo?: string;

    /**
   * Filtrar por nota_empenho
   * @example ""
   */
    @IsOptional()
    @IsString()
    @MaxLength(6)
    nota_empenho?: string;

    /**
   * Sempre é necessário passar o ano_referencia eg: 2022
   * @example ""
    */
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;

}

export class ListOrcamentoRealizadoDto {
    //linhas: OrcamentoRealizado[]
}
