import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';
import { PROCESSO_DESCRIPTION, PROCESSO_MESSAGE, PROCESSO_REGEXP } from '../../dotacao/dto/dotacao.dto';
import { OrcamentoRealizado } from '../entities/orcamento-realizado.entity';

export class CreateOrcamentoRealizadoItemDto {
    /**
     * Valor Empenho para meta - no momento aceitando zero, mas é meio sem sentido IMHO, uma vez que se ta registrando é pq ta alocado!
     * @example "42343.34"
     */
    @IsOptional()
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| Valor Empenho com até duas casas decimais' }
    )
    @Min(0, { message: '$property| Valor Empenhado precisa ser positivo ou zero' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null && value !== '')
    valor_empenho: number | null;

    /**
     * Percentual Empenhado para meta - zero ou mais
     * @example "20.34"
     */
    @IsOptional()
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| Percentual Empenhado com até duas casas decimais' }
    )
    @Min(0, { message: '$property| Percentual Empenhado precisa ser positivo ou zero' })
    @Max(100, { message: '$property| Percentual Empenhado precisa menor que 100' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null && value !== '')
    percentual_empenho: number | null;

    /**
     * Valor Liquidado para meta - zero ou mais
     * @example "42343.34"
     */
    @IsOptional()
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| Valor Liquidado com até duas casas decimais' }
    )
    @Min(0, { message: '$property| Valor Liquidado precisa ser positivo ou zero' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null && value !== '')
    valor_liquidado: number | null;

    /**
     * Percentual Liquidado para meta - zero ou mais
     * @example "20.34"
     */
    @IsOptional()
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| Percentual Liquidado com até duas casas decimais' }
    )
    @Min(0, { message: '$property| Percentual Liquidado precisa ser positivo ou zero' })
    @Max(100, { message: '$property| Percentual Liquidado precisa menor que 100' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null && value !== '')
    percentual_liquidado: number | null;

    /**
     * Valor Liquidado para meta - zero ou mais
     * @example "42343.34"
     */
    @IsInt({ message: '$property| Mês informado precisa ser entre 1 e 12' })
    @Min(1, { message: '$property| Mês informado precisa ser entre 1 e 12' })
    @Max(12, { message: '$property| Mês informado precisa ser entre 1 e 12' })
    mes: number;
}

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
     * dotacao: esperado exatamente a dotação com 35 ou 46/48 dígitos (cheia)
     *
     * @example "00.00.00.000.0000.0.000.00000000.00"
     */
    @Type(() => String) // fazendo cast pra texto sempre, já que tem a mask
    @MaxLength(100)
    @Matches(/^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}(?:\.\d{1}\.\d{3}\.\d{4})?(?:\.\d{1})?$/, {
        message:
            'Dotação não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00, 00.00.00.000.0000.0.000.00000000.00.0.000.0000 ou 00.00.00.000.0000.0.000.00000000.00.0.000.0000.0',
    })
    dotacao: string;

    /**
     * dotacao_complemento: esperado exatamente `0.000.0000.0` ou `0.000.0000`
     *
     * @example "0.000.0000.0"
     */
    @IsOptional()
    @Type(() => String) // fazendo cast pra texto sempre, já que tem a mask
    @MaxLength(100)
    @Matches(/^\d{1}\.\d{3}\.\d{4}(\.\d{1})?$/, {
        message: 'Dotação Complemento não está no formato esperado: 0.000.0000 ou 0.000.0000.0',
    })
    @ValidateIf((object, value) => value !== null)
    @Transform((a: TransformFnParams) => (a.value === '' ? null : a.value))
    dotacao_complemento?: string | null;

    @IsOptional()
    @Type(() => String) // fazendo cast pra texto sempre, já que tem a mask
    @MaxLength(20)
    @ApiProperty({ description: PROCESSO_DESCRIPTION, example: '6016201700379910' })
    @Matches(PROCESSO_REGEXP, { message: PROCESSO_MESSAGE })
    @ValidateIf((object, value) => value !== null && value !== '')
    processo?: string | null;

    /**
     * nota_empenho: esperado até 6 dígitos seguido de barra e o ano da nota
     * @example "00000/2022"
     */
    @IsOptional()
    @Type(() => String) // fazendo cast pra texto sempre, já que tem a mask
    @MaxLength(12)
    @Matches(/^\d{1,6}\/2\d{3}$/, {
        message: 'Nota não está no formato esperado: 000000/' + new Date(Date.now()).getFullYear(),
    })
    @ValidateIf((object, value) => value !== null && value !== '')
    nota_empenho?: string | null;

    @IsOptional()
    @IsString()
    @Matches(/^\d{4}$/, { message: 'Valor do ano da nota' })
    nota_ano?: string;

    @ValidateNested({ each: true })
    @Type(() => CreateOrcamentoRealizadoItemDto)
    @ArrayMinSize(1)
    @ArrayMaxSize(1024) // talvez seja 12, 1 pra cada mês
    @IsArray()
    itens: CreateOrcamentoRealizadoItemDto[];
}

export class UpdateOrcamentoRealizadoDto extends OmitType(CreateOrcamentoRealizadoDto, [
    'ano_referencia',
    'dotacao',
    'processo',
    'nota_empenho',
]) {}

export class FilterOrcamentoRealizadoDto {
    /**
     * Filtrar por meta_id: eg: 205
     * @example ""
     */
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id: number;

    /**
     * Filtrar por dotacao: eg: 00.00.00.000.0000.0.000.00000000.00
     * @example ""
     */
    @IsOptional()
    @IsString()
    dotacao?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    dotacao_complemento?: string | null;

    /**
     * Filtrar por processo
     * @example ""
     */
    @IsOptional()
    @IsString()
    @MaxLength(20)
    processo?: string | null;

    /**
     * Filtrar por nota_empenho
     * @example ""
     */
    @IsOptional()
    @IsString()
    @MaxLength(7)
    nota_empenho?: string | null;

    /**
     * Sempre é necessário passar o ano_referencia eg: 2022
     * @example ""
     */
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;

    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id precisa ser positivo' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    iniciativa_id?: number | null;

    @IsOptional()
    @IsInt({ message: '$property| atividade_id precisa ser positivo' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    atividade_id?: number | null;
}

export class OrcamentoRealizadoStatusConcluidoDto {
    concluido: boolean;
    concluido_por: IdNomeExibicaoDto | null;
    concluido_em: Date | null;
    pode_editar: boolean;
}

export class OrcamentoRealizadoStatusPermissoesDto {
    pode_editar: boolean;
    pode_excluir_lote: boolean;
}

export class ListOrcamentoRealizadoDto {
    linhas: OrcamentoRealizado[];
    concluido: OrcamentoRealizadoStatusConcluidoDto;
    permissoes: OrcamentoRealizadoStatusPermissoesDto;
}

export class PatchOrcamentoRealizadoConcluidoDto {
    /**
     * meta_id
     * @example "42"
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    meta_id: number;

    /**
     * Sempre é necessário passar o ano_referencia eg: 2022
     * @example ""
     */
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    ano_referencia: number;

    @IsOptional()
    @IsBoolean({ message: '$property| concluído precisa ser um boolean' })
    concluido: boolean;
}
