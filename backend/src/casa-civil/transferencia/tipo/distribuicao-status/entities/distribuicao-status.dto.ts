import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoStatusTipo } from '@prisma/client';

export class DistribuicaoStatusDto {
    id?: number;
    nome: string;
    @ApiProperty({ enum: DistribuicaoStatusTipo, enumName: 'DistribuicaoStatusTipo' })
    tipo: DistribuicaoStatusTipo;
    valor_distribuicao_contabilizado: boolean;
    pode_editar: boolean;
}

export class ListDistribuicaoStatusDto {
    linhas: DistribuicaoStatusDto[];
}
