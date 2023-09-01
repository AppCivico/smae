import { OmitType } from '@nestjs/swagger';
import {
    CreateOrcamentoRealizadoDto,
    CreateOrcamentoRealizadoItemDto,
    FilterOrcamentoRealizadoDto,
} from '../../../orcamento-realizado/dto/create-orcamento-realizado.dto';
import { PPOrcamentoRealizado } from '../entities/orcamento-realizado.entity';

export class CreatePPOrcamentoRealizadoItemDto extends CreateOrcamentoRealizadoItemDto {}

export class CreatePPOrcamentoRealizadoDto extends OmitType(CreateOrcamentoRealizadoDto, [
    'meta_id',
    'iniciativa_id',
    'atividade_id',
]) {}

export class UpdatePPOrcamentoRealizadoDto extends OmitType(CreatePPOrcamentoRealizadoDto, [
    'ano_referencia',
    'dotacao',
    'processo',
    'nota_empenho',
]) {}

export class FilterPPOrcamentoRealizadoDto extends OmitType(FilterOrcamentoRealizadoDto, ['meta_id']) {}

export class ListPPOrcamentoRealizadoDto {
    linhas: PPOrcamentoRealizado[];
}
