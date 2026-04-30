import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { DistribuicaoSolicitacaoStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterDistribuicaoSolicitacaoAjusteDto {
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Transform(({ value }) => (value === undefined || value === null || value === '' ? value : +value))
    distribuicao_recurso_id?: number;

    @IsOptional()
    @ApiPropertyOptional({ enum: DistribuicaoSolicitacaoStatus, enumName: 'DistribuicaoSolicitacaoStatus' })
    @IsEnum(DistribuicaoSolicitacaoStatus, { message: 'Status inválido' })
    status?: DistribuicaoSolicitacaoStatus;
}
