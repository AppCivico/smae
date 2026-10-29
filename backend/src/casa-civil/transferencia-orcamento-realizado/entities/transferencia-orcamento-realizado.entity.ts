import { OmitType } from '@nestjs/swagger';
import { OrcamentoRealizado } from '../../../orcamento-realizado/entities/orcamento-realizado.entity';

export class TransferenciaOrcamentoRealizadoDistribuicao {
    id: number;
    nome: string | null;
    objeto: string;
}

export class TransferenciaOrcamentoRealizado extends OmitType(OrcamentoRealizado, ['meta', 'iniciativa', 'atividade']) {
    transferencia_id: number;
    distribuicao_recurso: TransferenciaOrcamentoRealizadoDistribuicao | null;
    possui_vinculos: boolean;
}
