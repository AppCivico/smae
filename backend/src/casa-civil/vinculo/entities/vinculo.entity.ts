import { ApiProperty } from '@nestjs/swagger';
import { CampoVinculo } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';

export class VinculoDto {
    id: number;
    distribuicao_recurso: VinculoDistribuicaoDto;
    tipo_vinculo: IdNomeDto;
    @ApiProperty({ enum: CampoVinculo, enumName: 'CampoVinculo' })
    campo_vinculo: CampoVinculo;
    valor_vinculo: string;
    observacao: string | null;
    meta: VinculoMetaDto | null;
    projeto: VinculoProjetoDto | null;
    invalidado_em: Date | null;
    motivo_invalido: string | null;
    detalhes: {};
}

export class VinculoDistribuicaoDto {
    id: number;
    nome: string | null;
    valor: Decimal | null;
    orgao: {
        id: number;
        sigla: string;
        descricao: string;
    };
}

export class VinculoMetaDto {
    id: number;
    nome: string;
    status: string;
    orgao: IdSiglaDescricao;
}

export class VinculoProjetoDto {
    id: number;
    tipo: string;
    nome: string;
    portfolio: IdNomeDto;
    orgao: IdSiglaDescricao;
    status: string;
}

export class ListVinculoDto {
    linhas: VinculoDto[];
}
