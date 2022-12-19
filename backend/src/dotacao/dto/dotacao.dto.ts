import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from "class-validator";

export class AnoDto {
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

export class AnoDotacaoDto extends AnoDto {
    /**
    * dotacao: esperado exatamente
    * @example "00.00.00.000.0000.0.000.00000000.00"
    */
    @IsString()
    @MaxLength(40)
    @Matches(/^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}$/, { message: 'Dotação não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00' })
    dotacao: string;

}

export class AnoDotacaoProcessoDto extends AnoDto {
    /**
    * processo: esperado algo como "6016.2021/00532295", "6016.2021/0053229-5" ou "6016202100532295"
    * no banco será normalizado para o valor o número sozinho
    * @example "6016201700379910"
    */
    @IsString()
    @MaxLength(20)
    @Matches(/^\d{4}\.?\d{4}\/?\d{7}\-?\d$/, { message: 'Processo não está no formato esperado: 0000.0000/0000000-0' })
    processo: string;

}


export class AnoDotacaoNotaEmpenhoDto extends AnoDto {
    /**
    * dotacao: esperado exatamente 5 dígitos
    * @example "00000"
    */
    @IsString()
    @MaxLength(6)
    @Matches(/^\d{4,5}$/, { message: 'Nota não está no formato esperado: 00000' })
    nota_empenho: string;


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


export class ParteDotacaoDto {

    /**
    * parte_dotacao
    *
    * Aceita dotações parcialmente, onde os órgão, unidade, função, subfunção, projeto/atividade e fonte são obrigatórios
    *
    * @example "11.10.00.000.0000.2.100.00000000.00"
    */
    @IsString()
    @MaxLength(40)
    // faz o match parcial, mas alguns campos precisam ser completos
    @Matches(/^\d{2}\.\d{2}\.\d{2}\.\d{3}\.(\d{4}|\*)\.\d\.\d{3}\.(\d{8}|\*)\.\d{2}$/, {
        message: 'Dotação parcial não está no formato esperado: 00.00.00.000.*.0.000.*.00, podendo estar parcialmente preenchida com * nos campos faltantes'
    })
    @ValidateIf((object, value) => value !== '')
    parte_dotacao: string;
}

export class AnoParteDotacaoDto extends ParteDotacaoDto {
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


