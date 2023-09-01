import { OmitType } from '@nestjs/swagger';
import { MetaOrcamento } from '../../../meta-orcamento/entities/meta-orcamento.entity';

export class OrcamentoPrevistoDto extends OmitType(MetaOrcamento, ['atividade', 'iniciativa', 'meta']) {
    projeto_id: number;
}
