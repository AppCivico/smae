import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoStatusTipo } from 'src/generated/prisma/client';

export class DistribuicaoStatusDto {
    id?: number;
    nome: string;
    @ApiProperty({ enum: DistribuicaoStatusTipo, enumName: 'DistribuicaoStatusTipo' })
    tipo: DistribuicaoStatusTipo;
    valor_distribuicao_contabilizado: boolean;
    permite_novos_registros: boolean;
    pode_editar: boolean;
    status_base: boolean;
}

export class ListDistribuicaoStatusDto {
    linhas_base: DistribuicaoStatusDto[];
    linhas_customizadas: DistribuicaoStatusDto[];
}
