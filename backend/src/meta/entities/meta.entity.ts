import { ProjetoStatus, TipoPdm } from '@prisma/client';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IdCodNomeDto } from '../../common/dto/IdCodNome.dto';
import { IdNomeDto } from '../../common/dto/IdNome.dto';
import { GeolocalizacaoDto } from '../../geo-loc/entities/geo-loc.entity';
import { IdDescRegiaoComParent } from '../../pp/projeto/entities/projeto.entity';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';

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

export class MetaItemDto {
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
}

export class MetaPdmDto {
    meta_id: number;
    meta_codigo: string;
    meta_titulo: string;
    pdm_id: number;
    pdm_descricao: string;
    iniciativa_id?: number;
    iniciativa_codigo?: string;
    iniciativa_descricao?: string;
    atividade_id?: number;
    atividade_codigo?: string;
    atividade_descricao?: string;
    tipo: TipoPdm;
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
    pdm_metas: MetaPdmDto[];
    ps_metas: MetaPdmDto[];
    obras: IdObrasDto[];
    projetos: IdProjetoDto[];
}
