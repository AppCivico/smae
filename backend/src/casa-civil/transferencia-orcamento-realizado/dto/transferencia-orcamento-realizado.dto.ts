import { OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, ValidateIf } from 'class-validator';
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
