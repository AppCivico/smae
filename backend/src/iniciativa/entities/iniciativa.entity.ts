import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { GeolocalizacaoDto } from '../../geo-loc/entities/geo-loc.entity';
import { MetaIniAtvTag } from '../../meta/entities/meta.entity';
import { CreatePSEquipePontoFocalDto, CreatePSEquipeTecnicoCPDto } from '../../pdm/dto/create-pdm.dto';
import { CachedMetasDto } from '../../common/dto/origem-pdm.dto';

export class IdDesc {
    id: number;
    descricao: string;
}

export class IdNomeExibicao {
    id: number;
    nome_exibicao: string;
}

export class IniciativaOrgao {
    orgao: IdSiglaDescricao;
    responsavel: boolean;
    participantes: IdNomeExibicao[];
}

export class Iniciativa {
    id: number;
    status: string | null;
    meta_id: number;
    codigo: string;
    titulo: string;
    tags: MetaIniAtvTag[];
    contexto: string | null;
    complemento: string | null;
    orgaos_participantes: IniciativaOrgao[];
    coordenadores_cp: IdNomeExibicao[];
    compoe_indicador_meta: boolean;
    ativo: boolean;
    cronograma: CronogramaAtrasoGrau | null;
    geolocalizacao: GeolocalizacaoDto[];
    ps_tecnico_cp: CreatePSEquipeTecnicoCPDto;
    ps_ponto_focal: CreatePSEquipePontoFocalDto;
    resumo_origens: CachedMetasDto;
}
