import { IsEnum, IsNotIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { DistribuicaoSolicitacaoStatus } from '@prisma/client';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class GestaoDistribuicaoSolicitacaoAjusteDto {
    @IsEnum(DistribuicaoSolicitacaoStatus, { message: 'Status deve ser Aprovada ou Recusada' })
    @IsNotIn(['Pendente', 'EmRegistro'], { message: 'Status deve ser Aprovada ou Recusada' })
    status: 'Aprovada' | 'Recusada';

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Motivo da resposta' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    resposta_motivo?: string;
}
