import { OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, ValidateIf } from "class-validator";
import { MetaOrcamento } from "../entities/meta-orcamento.entity";

export class CreateMetaOrcamentoDto {

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
    *
    * Aceita partes da dotacao incompleta, aceitando * no lugar
    *
    * eg: 00.00.00.*.0000.0.000.00000000.00
    * eg: 00.00.*.*.0000.0.000.00000000.00
    *
    * embora alguma combinações não façam sentido, por exemplo
    * eg: *.01.*.*.0000.0.000.00000000.00
    *
    * se existe o código 01 na unidade (segunda posição) sempre deveria existir um órgão
    *
    * e também não pode cortar o projeto/atividade (sempre vir junto, separando o código com um 'ponto')
    * que é a sexta e sétima posição se contar os pontos. eg: `*.*.*.*.*.0.000.*.*` é válido, mas `*.*.*.*.*.*.000.*.*` ou `*.*.*.*.*.0.*.*.*` não é
    *
    * @example "00.00.00.000.0000.0.000.00000000.00"
    */
    @IsString()
    @MaxLength(40)
    // faz o match parcial, mas alguns campos precisam ser completos
    @Matches(/^((\d{2}|\*)(\.(\d{2}|\*)(\.(\d{2}|\*)(\.(\d{3}|\*)(\.(\d{4}|\*)((?:\.(\d\.\d{3}|\*))(\.(\d{8}|\*)(\.(\d{2}|\*)(\-\d)?)?)?)?)?)?)?)?)?$/, {
        message: 'Dotação parcial não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00, podendo estar parcialmente preenchida com * nos campos faltantes'
    })
    @ValidateIf((object, value) => value !== '')
    parte_dotacao: string;
}

// deixa mudar praticamente tudo, pois não há contas, então pode mudar a parte-dotação e etc
export class UpdateMetaOrcamentoDto extends OmitType(PartialType(CreateMetaOrcamentoDto), ['ano_referencia']) { }

export class FilterMetaOrcamentoDto {
    /**
   * Filtrar por meta_id
   * @example "42"
    */
    @IsOptional()
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id?: number;

    /**
   * Filtrar por ano_referencia?
   * @example "2022"
    */
    @IsOptional()
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia?: number;

}

export class ListMetaOrcamentoDto {
    linhas: MetaOrcamento[]
}
