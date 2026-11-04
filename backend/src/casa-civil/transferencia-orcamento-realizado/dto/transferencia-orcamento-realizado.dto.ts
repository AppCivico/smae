import { OmitType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../../auth/transforms/number-array.transform';
import { CreateOrcamentoRealizadoDto } from '../../../orcamento-realizado/dto/create-orcamento-realizado.dto';
import { TransferenciaOrcamentoRealizado } from '../entities/transferencia-orcamento-realizado.entity';

export class CreateTransferenciaOrcamentoRealizadoDto extends OmitType(CreateOrcamentoRealizadoDto, [
    'meta_id',
    'iniciativa_id',
    'atividade_id',
]) {
    /**
     * distribuição da própria transferência; null ou ausente = associado à transferência
     * @example 7
     */
    @IsOptional()
    @IsInt({ message: 'distribuicao_recurso_id precisa ser positivo' })
    @Min(1, { message: 'distribuicao_recurso_id precisa ser positivo' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    distribuicao_recurso_id?: number | null;
}

export class UpdateTransferenciaOrcamentoRealizadoDto extends OmitType(CreateTransferenciaOrcamentoRealizadoDto, [
    'ano_referencia',
    'dotacao',
    'dotacao_complemento',
    'processo',
    'nota_empenho',
    'nota_ano',
    'distribuicao_recurso_id',
]) {}

export class ListTransferenciaOrcamentoRealizadoDto {
    linhas: TransferenciaOrcamentoRealizado[];
}

export class FilterTransferenciaOrcamentoRealizadoCompartilhadoDto {
    /**
     * @example 2026
     */
    @IsInt({ message: 'ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;

    /**
     * @example "00.00.00.000.0000.0.000.00000000.00"
     */
    @IsString()
    dotacao: string;

    @IsOptional()
    @IsString()
    processo?: string;

    @IsOptional()
    @IsString()
    nota_empenho?: string;

    /**
     * ids de orçamento realizado a remover do retorno; aceita `not_id=1&not_id=2` ou `not_id=1,2`
     */
    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    not_id?: number[];
}
