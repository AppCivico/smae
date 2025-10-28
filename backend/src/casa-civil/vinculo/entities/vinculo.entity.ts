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
    meta: VinculoMetaIniAtvDto | null;
    iniciativa: VinculoMetaIniAtvDto | null;
    atividade: VinculoMetaIniAtvDto | null;
    projeto: VinculoProjetoDto | null;
    pdm: VinculoPdmDto | null;
    invalidado_em: Date | null;
    motivo_invalido: string | null;
    detalhes: VinculoDetalheObraDto | null;
}

export class VinculoDistribuicaoDto {
    id: number;
    nome: string | null;
    valor: Decimal | null;
    orgao: IdSiglaDescricao;

    transferencia: {
        id: number;
        nome: string | null;
        valor: Decimal | null;
        orgao_concedente: IdSiglaDescricao;
    };
}

export class VinculoMetaIniAtvDto {
    id: number;
    nome: string;
    status: string | null;
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

export class VinculoDetalheObraDto {
    grupo_tematico_nome: string | null;
    equipamento_nome: string | null;
    subprefeitura_nome: string | null;
    tipo_intervencao_nome: string | null;
}

export class VinculoPdmDto {
    rotulo_iniciativa: string | null;
    rotulo_atividade: string | null;
    rotulo_macro_tema: string | null;
}
export class ListVinculoDto {
    linhas: VinculoDto[];
}
