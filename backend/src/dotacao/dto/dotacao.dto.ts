import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export const PROCESSO_REGEXP = /^(?:\d{4}\.?\d{4}\/?\d{7}\-?\d|\d{4}\-?\d\.?\d{3}\.?\d{3}\-?\d)$/;
export const PROCESSO_MESSAGE = 'Processo não está no formato esperado: DDDD.DDDD/DDDDDDD-D (SEI) ou AAAA-D.DDD.DDD-D (SINPROC)';
export const PROCESSO_DESCRIPTION = `há dois tipos de processo:
- processo SEI (16 dígitos) esperado "6016.2021/00532295", "6016.2021/0053229-5" ou "6016202100532295"

- processo SINPROC (12 dígitos) esperado: "AAAA-D.DDD.DDD-D" ou "201601234567"

no banco será normalizado para o valor o número sozinho`;

export class AnoDto {
    /**
     * ano: ano para pesquisa
     * @example "2022"
     */
    @IsInt({ message: '$property| ano precisa ser positivo' })
    @Min(2003)
    @Max(2050)
    @Type(() => Number)
    ano: number;
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
    @ApiProperty({ description: PROCESSO_DESCRIPTION, example: '6016201700379910' })
    @IsString()
    @MaxLength(20)
    @Matches(PROCESSO_REGEXP, { message: PROCESSO_MESSAGE })
    processo: string;
}

export class AnoDotacaoNotaEmpenhoDto extends AnoDto {
    /**
     * dotacao: esperado exatamente 5 dígitos seguido de barra e o ano da nota
     * @example "00000/2022"
     */
    @IsString()
    @MaxLength(11)
    @Matches(/^\d{5}\/2\d{3}$/, { message: 'Nota não está no formato esperado: 00000/AAAA' })
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
    mes?: number;
}

export class ParteDotacaoDto {
    /**
     * parte_dotacao
     *
     * Aceita dotações parcialmente, onde os órgão, unidade, função, subfunção, projeto/atividade e fonte são obrigatórios
     *
     * unidade deve ser obrigatório apenas quando existe alguma unidade já registrada no órgão, mas pode ser enviado com valores
     * com * caso não tenha nenhum, ou deixar o usuário digitar qualquer digito
     *
     * eg: `03.30.00.000.0000.2.100.00000000.00`, `03.*.00.000.0000.2.100.00000000.00`
     *
     * @example "11.10.00.000.0000.2.100.00000000.00"
     */
    @IsString()
    @MaxLength(40)
    // faz o match parcial, mas alguns campos precisam ser completos
    @Matches(/^\d{2}\.(\d{2}|\*)\.\d{2}\.\d{3}\.(\d{4}|\*)\.\d\.\d{3}\.(\d{8}|\*)\.\d{2}$/, {
        message: 'Dotação parcial não está no formato esperado: 00.00.00.000.*.0.000.*.00, podendo estar parcialmente preenchida com * nos campos faltantes',
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
    ano: number;
}
