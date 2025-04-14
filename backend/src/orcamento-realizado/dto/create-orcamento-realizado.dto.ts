import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
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
import { PositiveNumberTransform } from '../../auth/transforms/number.transform';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';
import { IdSiglaDescricao } from '../../common/dto/IdSigla.dto';
import { CONST_PROC_SEI_SINPROC_DESCR, CONST_PROC_SEI_SINPROC_MESSAGE, CONST_PROC_SEI_SINPROC_REGEXP } from '../../dotacao/dto/dotacao.dto';
import { OrcamentoRealizado } from '../entities/orcamento-realizado.entity';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

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
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Dotação' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Dotação empenho' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @Matches(/^\d{1}\.\d{3}\.\d{4}(\.\d{1})?$/, {
        message: 'Dotação Complemento não está no formato esperado: 0.000.0000 ou 0.000.0000.0',
    })
    @ValidateIf((object, value) => value !== null)
    @Transform((a: TransformFnParams) => (a.value === '' ? null : a.value))
    dotacao_complemento?: string | null;

    @IsOptional()
    @Type(() => String) // fazendo cast pra texto sempre, já que tem a mask
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Processo' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @ApiProperty({ description: CONST_PROC_SEI_SINPROC_DESCR, example: '6016201700379910' })
    @Matches(CONST_PROC_SEI_SINPROC_REGEXP, { message: CONST_PROC_SEI_SINPROC_MESSAGE })
    @ValidateIf((object, value) => value !== null && value !== '')
    processo?: string | null;

    /**
     * nota_empenho: esperado até 6 dígitos seguido de barra e o ano da nota
     * @example "00000/2022"
     */
    @IsOptional()
    @Type(() => String) // fazendo cast pra texto sempre, já que tem a mask
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nota empenho' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
    @ArrayMinSize(1, { message: 'Informe pelo menos um mês o orçamento realizado' })
    @ArrayMaxSize(1024) // talvez seja 12, 1 pra cada mês
    @IsArray({ message: 'itens do orcamento precisa ser um array' })
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
     * not_id - remove um ID do retorno do orçamento (usado na busca do compartilhamento)
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| remove um item de orçamento da lista' })
    @Type(() => Number)
    not_id?: number;

    /**
     * meta_id: eg: 205 - necessário para buscar o status do 'concluido' no retorno
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
    processo?: string | null;

    /**
     * Filtrar por nota_empenho
     * @example ""
     */
    @IsOptional()
    @IsString()
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

export class FilterOrcamentoRealizadoCompartilhadoDto extends PickType(FilterOrcamentoRealizadoDto, [
    'dotacao',
    'processo',
    'ano_referencia',
    'not_id',
]) {
    @IsInt({ message: '$property| pdm_id precisa ser positivo' })
    @Transform(PositiveNumberTransform)
    pdm_id: number;

    @IsOptional()
    @IsString()
    nota_empenho?: string | null;
}

export class OrcamentoRealizadoStatusConcluidoDto {
    concluido: boolean;
    concluido_por: IdNomeExibicaoDto | null;
    concluido_em: Date | null;
    pode_editar: boolean;
}

export class OrcamentoRealizadoStatusConcluidoAdminDto {
    concluido: boolean;
    concluido_por: IdNomeExibicaoDto | null;
    orgao: IdSiglaDescricao;
    concluido_em: Date | null;
}

export class OrcamentoRealizadoStatusPermissoesDto {
    pode_editar: boolean;
    pode_excluir_lote: boolean;
}

export class ListApenasOrcamentoRealizadoDto {
    linhas: OrcamentoRealizado[];
}

export class ListOrcamentoRealizadoDto extends ListApenasOrcamentoRealizadoDto {
    concluido: OrcamentoRealizadoStatusConcluidoDto | null;
    concluido_admin: OrcamentoRealizadoStatusConcluidoAdminDto[] | null;
    permissoes: OrcamentoRealizadoStatusPermissoesDto;
}

export class PatchOrcamentoRealizadoConcluidoDto {
    /**
     * meta_id
     * @example "42"
     */
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

export class PatchOrcamentoRealizadoConcluidoComOrgaoDto extends PatchOrcamentoRealizadoConcluidoDto {
    @IsInt({ message: '$property| orgao_id precisa ser positivo' })
    orgao_id: number;
}
