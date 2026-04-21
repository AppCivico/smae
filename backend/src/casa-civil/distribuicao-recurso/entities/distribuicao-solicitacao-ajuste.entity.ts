import { DistribuicaoSolicitacaoStatus } from '@prisma/client';

export class CampoSolicitadoDto {
    de: any;
    para: any;
}

export class DistribuicaoSolicitacaoAjusteDto {
    id: number;
    distribuicao_recurso_id: number;
    orgao_gestor_id: number;
    status: DistribuicaoSolicitacaoStatus;
    campos_solicitados: Record<string, CampoSolicitadoDto>;
    resposta_motivo: string | null;
    respondido_por: number | null;
    respondido_em: Date | null;
    criado_por: number;
    criado_em: Date;
    atualizado_por: number | null;
    atualizado_em: Date;
}

export class ListDistribuicaoSolicitacaoAjusteDto {
    linhas: DistribuicaoSolicitacaoAjusteDto[];
}
