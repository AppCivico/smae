import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from "class-validator";

export class AnoDotacaoDto {
    /**
    * dotacao: esperado exatamente
    * @example "00.00.00.000.0000.0.000.00000000.00"
    */
    @IsString()
    @MaxLength(40)
    @Matches(/^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}$/, { message: 'Dotação não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00' })
    dotacao: string;

    /**
    * ano: ano para pesquisa
    * @example "2022"
    */
    @IsInt({ message: '$property| ano precisa ser positivo' })
    @Min(2003)
    @Max(2050)
    @Type(() => Number)
    ano: number
}

export class AnoDotacaoProcessoDto {
    /**
    * processo: esperado algo como "6016.2021/00532295", "6016.2021/0053229-5" ou "6016202100532295"
    * no banco será normalizado para o valor o número sozinho
    * @example "6016202100532295"
    */
    @IsString()
    @MaxLength(20)
    @Matches(/^\d{4}\.?\d{4}\/?\d{7}\-?\d$/, { message: 'Processo não está no formato esperado: 0000.0000/0000000-0' })
    processo: string;

    /**
    * ano: ano para pesquisa
    * @example "2022"
    */
    @IsInt({ message: '$property| ano precisa ser positivo' })
    @Min(2003)
    @Max(2050)
    @Type(() => Number)
    ano: number
}


export class AnoDotacaoNotaEmpenhoDto {
    /**
    * dotacao: esperado exatamente 5 dígitos
    * @example "00000"
    */
    @IsString()
    @MaxLength(6)
    @Matches(/^\d{5}$/, { message: 'Nota não está no formato esperado: 00000' })
    nota_empenho: string;

    /**
   * ano: ano para pesquisa
   * @example "2022"
   */
    @IsInt({ message: '$property| ano precisa ser positivo' })
    @Min(2003)
    @Max(2050)
    @Type(() => Number)
    ano: number

    /**
   * mes: padrão é o mes mais velho do ano
   * @example "1"
   */
    @IsOptional()
    @IsInt({ message: '$property| mês precisa ser positivo' })
    @Min(1)
    @Max(12)
    @Transform(({ value }: any) => +value)
    mes?: number
}
