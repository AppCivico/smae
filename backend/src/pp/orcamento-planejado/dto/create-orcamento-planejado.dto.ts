import { OmitType } from '@nestjs/swagger';
import { CreateOrcamentoPlanejadoDto, FilterOrcamentoPlanejadoDto } from '../../../orcamento-planejado/dto/orcamento-planejado.dto';
import { PPOrcamentoPlanejadoDto } from '../entities/orcamento-planejado.entity';

export class CreatePPOrcamentoPlanejadoDto extends OmitType(CreateOrcamentoPlanejadoDto, ['meta_id', 'iniciativa_id', 'atividade_id'] as const) {}

export class UpdatePPOrcamentoPlanejadoDto extends OmitType(CreatePPOrcamentoPlanejadoDto, ['ano_referencia', 'dotacao'] as const) { }

export class FilterPPOrcamentoPlanejadoDto extends OmitType(FilterOrcamentoPlanejadoDto, ['meta_id'] as const) { }

export class ListPPOrcamentoPlanejadoDto {
    linhas: PPOrcamentoPlanejadoDto[];
}
