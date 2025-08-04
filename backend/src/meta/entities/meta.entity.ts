import { ApiProperty } from '@nestjs/swagger';
import { ProjetoStatus, TipoPdm } from 'src/generated/prisma/client';
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
