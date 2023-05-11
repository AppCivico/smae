import { OmitType } from "@nestjs/swagger";
import { OrcamentoRealizado } from "../../../orcamento-realizado/entities/orcamento-realizado.entity";

export class PPOrcamentoRealizado extends OmitType(OrcamentoRealizado, ['meta', 'iniciativa', 'atividade']) {
    projeto_id: number
 }
