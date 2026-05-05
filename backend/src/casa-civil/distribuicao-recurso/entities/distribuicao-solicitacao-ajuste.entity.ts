import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoSolicitacaoStatus } from '@prisma/client';
import { IdNomeExibicaoDto } from 'src/common/dto/IdNomeExibicao.dto';

export class CampoSolicitadoDto {
    de: unknown;
    para: unknown;
}

export class DistribuicaoSolicitacaoAjusteDto {
    id: number;
    distribuicao_recurso_id: number;
    orgao_gestor_id: number;
    @ApiProperty({ enum: DistribuicaoSolicitacaoStatus, enumName: 'DistribuicaoSolicitacaoStatus' })
    status: DistribuicaoSolicitacaoStatus;
    @ApiProperty({ type: 'object', additionalProperties: true })
    campos_solicitados: Record<string, CampoSolicitadoDto>;
    informacoes_complementares: string | null;
    gestor_contrato: string | null;
    resposta_motivo: string | null;
    respondido_por: number | null;
    respondido_em: Date | null;
    criado_por: number;
    criado_em: Date;
    criador: IdNomeExibicaoDto;
    atualizado_por: number | null;
    atualizado_em: Date;
    pode_editar: boolean;
    pode_aprovar: boolean;
}

export class ListDistribuicaoSolicitacaoAjusteDto {
    linhas: DistribuicaoSolicitacaoAjusteDto[];
}
