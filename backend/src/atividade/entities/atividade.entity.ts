import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';
import { GeolocalizacaoDto } from '../../geo-loc/entities/geo-loc.entity';
import { MetaIniAtvTag } from '../../meta/entities/meta.entity';
import { CreatePSEquipePontoFocalDto, CreatePSEquipeTecnicoCPDto } from '../../pdm/dto/create-pdm.dto';
import { CachedMetasDto } from '../../common/dto/origem-pdm.dto';

export class IdDesc {
    id: number;
    descricao: string;
}

export class AtividadeOrgao {
    orgao: IdSiglaDescricao;
    responsavel: boolean;
    participantes: IdNomeExibicaoDto[];
}

export class Atividade {
    id: number;
    tags: MetaIniAtvTag[];
    status: string | null;
    iniciativa_id: number;
    codigo: string;
    titulo: string;
    contexto: string | null;
    complemento: string | null;
    orgaos_participantes: AtividadeOrgao[];
    coordenadores_cp: IdNomeExibicaoDto[];
    compoe_indicador_iniciativa: boolean;
    ativo: boolean;
    cronograma: CronogramaAtrasoGrau | null;
    geolocalizacao: GeolocalizacaoDto[];
    ps_tecnico_cp: CreatePSEquipeTecnicoCPDto;
    ps_ponto_focal: CreatePSEquipePontoFocalDto;
    resumo_origens: CachedMetasDto;
}
