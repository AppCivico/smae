import { OmitType } from "@nestjs/swagger";
import { OrcamentoPlanejado } from "../../../orcamento-planejado/entities/orcamento-planejado.entity";

export class PPOrcamentoPlanejadoDto extends OmitType(OrcamentoPlanejado, ['atividade', 'iniciativa', 'meta']) {
    projeto_id: number;
}
