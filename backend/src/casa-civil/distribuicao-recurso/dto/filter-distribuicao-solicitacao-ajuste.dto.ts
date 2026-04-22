import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { DistribuicaoSolicitacaoStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class FilterDistribuicaoSolicitacaoAjusteDto {
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Transform(({ value }) => (value === undefined || value === null || value === '' ? value : +value))
    distribuicao_recurso_id?: number;

    @IsOptional()
    @IsEnum(DistribuicaoSolicitacaoStatus, { message: 'Status inválido' })
    status?: DistribuicaoSolicitacaoStatus;
}
