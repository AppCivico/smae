import { ApiProperty } from '@nestjs/swagger';
import { ProjetoStatus, TipoPdm } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IdCodNomeDto } from '../../common/dto/IdCodNome.dto';
import { IdNomeDto } from '../../common/dto/IdNome.dto';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { ResumoDetalheOrigensDto } from '../../common/dto/origem-pdm.dto';
import { GeolocalizacaoDto } from '../../geo-loc/entities/geo-loc.entity';
import { CreatePSEquipePontoFocalDto, CreatePSEquipeTecnicoCPDto } from '../../pdm/dto/create-pdm.dto';
import { IdDescRegiaoComParent } from '../../pp/projeto/entities/projeto.entity';

export class IdDesc {
    id: number;
    descricao: string;
}

export class IdNomeExibicao {
    id: number;
    nome_exibicao: string;
}

export class MetaOrgao {
    orgao: IdSiglaDescricao;
    responsavel: boolean;
    participantes: IdNomeExibicao[];
}

export class MetaIniAtvTag {
    id: number;
    descricao: string;
    download_token: string | null;
}

export class MetaOrcamentoConsolidado {
    // Totais gerais
    total_previsao: string;
    total_empenhado: string;
    total_liquidado: string;

    // Totais de Projetos (primeiro dígito ímpar do projeto_atividade)
    total_previsao_projeto: string;
    total_empenhado_projeto: string;
    total_liquidado_projeto: string;

    // Totais de Atividades (primeiro dígito par e != 0)
    total_previsao_atividade: string;
    total_empenhado_atividade: string;
    total_liquidado_atividade: string;

    // Totais de Operações Especiais (primeiro dígito = 0)
    total_previsao_operacao_especial: string;
    total_empenhado_operacao_especial: string;
    total_liquidado_operacao_especial: string;

    atualizado_em: Date;
}

export class MetaItemDto extends ResumoDetalheOrigensDto {
    id: number;
    status: string;
    pdm_id: number;
    codigo: string;
    titulo: string;
    contexto: string | null;
    complemento: string | null;
    macro_tema: IdDesc | null;
    tema: IdDesc | null;
    sub_tema: IdDesc | null;
    ativo: boolean;
    orgaos_participantes: MetaOrgao[];
    coordenadores_cp: IdNomeExibicao[];
    tags: MetaIniAtvTag[];
    cronograma: CronogramaAtrasoGrau | null;
    geolocalizacao: GeolocalizacaoDto[];
    orcamento: MetaOrcamentoConsolidado | null;
    pode_editar: boolean;
    ps_tecnico_cp: CreatePSEquipeTecnicoCPDto;
    ps_ponto_focal: CreatePSEquipePontoFocalDto;
}

export const MetaPdmRelacionamentoDirecao = {
    'rev': 'rev',
    'fwd': 'fwd',
} as const;
export type MetaPdmRelacionamentoDirecao = keyof typeof MetaPdmRelacionamentoDirecao;

export class MetaPdmDto {
    pdm_id: number;
    pdm_nome: string;
    pdm_rotulo_iniciativa: string;
    pdm_rotulo_atividade: string;

    meta_id: number;
    meta_codigo: string;
    meta_titulo: string;
    meta_orgaos: IdSigla[];

    iniciativa_id?: number;
    iniciativa_codigo?: string;
    iniciativa_descricao?: string;
    iniciativa_orgaos?: IdSigla[];

    atividade_id?: number;
    atividade_codigo?: string;
    atividade_descricao?: string;
    atividade_orgaos?: IdSigla[];

    tipo: TipoPdm;

    @IsEnum(MetaPdmRelacionamentoDirecao)
    @ApiProperty({ enum: MetaPdmRelacionamentoDirecao })
    direcao: MetaPdmRelacionamentoDirecao;
}

export class IdObrasDto {
    id: number;
    codigo: string | null;
    nome: string;
    tipo_intervencao: IdNomeDto | null;
    subprefeituras: IdDescRegiaoComParent[];
    equipamento: IdNomeDto | null;
    status: ProjetoStatus;
    percentual_concluido: number | null;
}
export class IdProjetoDto extends IdCodNomeDto {
    portfolio: IdTituloDto;
    projeto_etapa: IdDesc | null;
}

export class RelacionadosDTO {
    metas: MetaPdmDto[];
    obras: IdObrasDto[];
    projetos: IdProjetoDto[];
}
